import { z } from 'zod';
import { campusCallable, callableOptions, parseInput, docId } from './callable.js';
import { HttpsError } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';
import {
  SanitizedQuizQuestion,
  QuizAnswerSubmission,
  QuizAnswerReview,
  QuizAttempt,
  TopicStatus,
  publishedQuizSubmissionSchema,
  draftQuizSubmissionSchema,
} from '@solvesphere/shared';

/**
 * Callable Function: getQuizQuestions
 * Returns sanitized questions (stripping correctOptionIndex and explanation)
 * to prevent students from cheating prior to submission.
 */
export const getQuizQuestions = campusCallable(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to access quizzes.');
  }

  const { quizId } = parseInput(z.object({ quizId: docId }), request.data);
  if (!quizId) {
    throw new HttpsError('invalid-argument', 'quizId is required.');
  }

  const db = admin.firestore();
  const quizDoc = await db.collection('quizzes').doc(quizId).get();
  if (!quizDoc.exists) {
    throw new HttpsError('not-found', `Quiz ${quizId} was not found.`);
  }

  // Unpublished drafts can only be previewed by Administrators
  if (!quizDoc.data()?.published && request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('failed-precondition', 'This assessment is currently an unpublished draft and cannot be viewed by students.');
  }

  const questionsSnap = await db
    .collection('quizzes')
    .doc(quizId)
    .collection('questions')
    .get();

  const sanitized: SanitizedQuizQuestion[] = questionsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      quizId,
      questionText: data.questionText || '',
      options: data.options || [],
      subjectId: data.subjectId || quizDoc.data()?.subjectId,
    };
  });

  return {
    quizId,
    title: quizDoc.data()?.title || '',
    durationMinutes: quizDoc.data()?.durationMinutes || 15,
    questions: sanitized,
  };
});

/**
 * Callable Function: submitQuiz
 * Trusted server-side grading of multiple-choice quiz questions.
 * Grades submissions against true keys stored in Firestore, generates explanations,
 * records the attempt in quizAttempts, and returns the verified score.
 */
export const submitQuiz = campusCallable(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to submit quiz.');
  }

  const { quizId, answers, submissionId } = parseInput(z.object({
    quizId: docId, submissionId: z.uuid().optional(),
    answers: z.array(z.object({ questionId: docId, selectedOptionIndex: z.number().int().min(-1).max(99) })).max(200),
  }), request.data);

  const db = admin.firestore();
  const uid = request.auth.uid;

  // Retrieve user details
  let studentName = request.auth.token.name || request.auth.token.email || 'Student';
  const userDoc = await db.collection('users').doc(uid).get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    if (request.auth.token.role !== 'ADMIN' && userData?.enrollmentStatus !== 'VERIFIED') {
      throw new HttpsError(
        'permission-denied',
        'Official continuous assessment quiz submission requires verified institutional student enrollment.'
      );
    }
    studentName = userData?.fullName || studentName;
  } else if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Student user profile not found.');
  }

  if (request.auth.token.role !== 'ADMIN' && !request.auth.token.email_verified) {
    throw new HttpsError('failed-precondition', 'Verify your email address before submitting an assessment.');
  }

  const quizDoc = await db.collection('quizzes').doc(quizId).get();
  if (!quizDoc.exists) {
    throw new HttpsError('not-found', `Quiz ${quizId} was not found.`);
  }

  // Unpublished drafts can only be previewed by Administrators
  if (!quizDoc.data()?.published && request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('failed-precondition', 'This assessment is currently an unpublished draft and cannot be viewed by students.');
  }
  const quizData = quizDoc.data()!;

  // Fetch full questions with answer keys
  const questionsSnap = await db
    .collection('quizzes')
    .doc(quizId)
    .collection('questions')
    .get();

  if (questionsSnap.empty) {
    throw new HttpsError('failed-precondition', 'Quiz has no questions configured.');
  }

  const answerMap = new Map<string, number>();
  for (const ans of answers) {
    answerMap.set(ans.questionId, ans.selectedOptionIndex);
  }

  let correctCount = 0;
  const reviews: QuizAnswerReview[] = [];

  for (const qDoc of questionsSnap.docs) {
    const qData = qDoc.data();
    const qId = qDoc.id;
    const selected = answerMap.has(qId) ? answerMap.get(qId)! : -1;
    const isCorrect = selected === qData.correctOptionIndex;

    if (isCorrect) {
      correctCount++;
    }

    reviews.push({
      questionId: qId,
      questionText: qData.questionText || '',
      options: qData.options || [],
      selectedOptionIndex: selected,
      correctOptionIndex: qData.correctOptionIndex,
      isCorrect,
      explanation: qData.explanation || 'No explanation provided.',
    });
  }

  const totalQuestions = questionsSnap.size;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const now = new Date().toISOString();

  // Create persistent attempt record
  const attempts = db.collection('quizAttempts');
  const attemptRef = submissionId ? attempts.doc(`${uid}_${submissionId}`) : attempts.doc();
  const attemptData: QuizAttempt = {
    id: attemptRef.id,
    userId: uid,
    studentName,
    quizId,
    quizTitle: quizData.title || 'Practice Quiz',
    subjectId: quizData.subjectId || '',
    score: correctCount,
    totalQuestions,
    percentage,
    answers: reviews,
    completedAt: now,
  };

  const saved = await db.runTransaction(async tx => {
    const previous = await tx.get(attemptRef);
    if (previous.exists) {
      if (previous.data()?.quizId !== quizId) throw new HttpsError('already-exists', 'This submission belongs to another quiz.');
      return previous.data();
    }
    tx.create(attemptRef, attemptData);
    return attemptData;
  });

  return {
    success: true,
    attempt: saved,
  };
});

/**
 * Callable Function: adminSaveQuiz (Admin only)
 * Provisions or updates a complete quiz with question keys.
 */
export const adminSaveQuiz = campusCallable(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can manage quizzes.');
  }

  const schema = request.data?.quiz?.published === true ? publishedQuizSubmissionSchema : draftQuizSubmissionSchema;
  const parsed = schema.safeParse(request.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', parsed.error.issues[0].message);
  const { quiz, questions } = parsed.data;
  const db = admin.firestore();
  const quizId = quiz.id || db.collection('quizzes').doc().id;
  const now = new Date().toISOString();

  const quizRef = db.collection('quizzes').doc(quizId);
  await db.runTransaction(async tx => {
    const existing = await tx.get(quizRef);
    const oldQuestions = await tx.get(quizRef.collection('questions'));
    const keep = new Set<string>();
    for (const question of questions) {
      const ref = question.id ? quizRef.collection('questions').doc(question.id) : quizRef.collection('questions').doc();
      if (keep.has(ref.id)) throw new HttpsError('invalid-argument', 'Question identifiers must be unique.');
      keep.add(ref.id);
      tx.set(ref, { ...question, id: ref.id, quizId, subjectId: quiz.subjectId });
    }
    for (const old of oldQuestions.docs) if (!keep.has(old.id)) tx.delete(old.ref);
    tx.set(quizRef, {
      ...quiz, id: quizId, questionsCount: questions.length, updatedAt: now,
      createdAt: existing.data()?.createdAt || now,
    });
  });

  return {
    success: true,
    quizId,
    published: Boolean(quiz.published),
  };
});

/**
 * Callable Function: adminDeleteQuiz (Admin only)
 */
export const adminDeleteQuiz = campusCallable(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can delete quizzes.');
  }

  const { quizId } = parseInput(z.object({ quizId: docId }), request.data);
  if (!quizId) {
    throw new HttpsError('invalid-argument', 'quizId is required.');
  }

  const db = admin.firestore();
  const quizRef = db.collection('quizzes').doc(quizId);
  const questionsSnap = await quizRef.collection('questions').get();

  const batch = db.batch();
  for (const doc of questionsSnap.docs) {
    batch.delete(doc.ref);
  }
  batch.delete(quizRef);

  await batch.commit();

  return { success: true };
});

/**
 * Callable Function: adminUpdateTopicStatus (Admin only)
 * Updates topic status, logs timestamp and editor.
 */
export const adminUpdateTopicStatus = campusCallable(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can update syllabus topics.');
  }

  const { topicId, status, completedAt } = parseInput(z.object({
    topicId: docId, status: z.enum(['COMPLETED','ONGOING','UPCOMING']), completedAt: z.string().max(40).optional(),
  }), request.data);

  const db = admin.firestore();
  const topicRef = db.collection('syllabusTopics').doc(topicId);
  const adminName = request.auth.token.name || request.auth.token.email || 'Administrator';
  const now = new Date().toISOString();

  await topicRef.update({
    status,
    completedAt: status === 'COMPLETED' ? completedAt || now.split('T')[0] : admin.firestore.FieldValue.delete(),
    isCurrent: status === 'ONGOING',
    updatedAt: now,
    updatedBy: adminName,
  });

  return { success: true, topicId, status };
});

/**
 * Callable Function: toggleStudentTopicProgress
 * Lets a student independently track personal study completion of a topic
 * without modifying official classroom teaching records.
 */
export const toggleStudentTopicProgress = campusCallable(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const { topicId, subjectId, completed } = parseInput(z.object({
    topicId: docId, subjectId: docId, completed: z.boolean(),
  }), request.data);

  const db = admin.firestore();
  const uid = request.auth.uid;
  const progressDocId = `${uid}_${topicId}`;
  const now = new Date().toISOString();

  const progressRef = db.collection('studentStudyProgress').doc(progressDocId);
  await progressRef.set({
    id: progressDocId,
    userId: uid,
    topicId,
    subjectId: subjectId || '',
    completed,
    updatedAt: now,
  });

  return { success: true, progressDocId, completed };
});
