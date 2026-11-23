import { onCall, HttpsError } from 'firebase-functions/v2/https';
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
export const getQuizQuestions = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to access quizzes.');
  }

  const { quizId } = request.data || {};
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
export const submitQuiz = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to submit quiz.');
  }

  const { quizId, answers } = request.data as {
    quizId: string;
    answers: QuizAnswerSubmission[];
  };

  if (!quizId || !Array.isArray(answers)) {
    throw new HttpsError('invalid-argument', 'quizId and answers array are required.');
  }

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
  const attemptRef = db.collection('quizAttempts').doc();
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

  await attemptRef.set(attemptData);

  return {
    success: true,
    attempt: attemptData,
  };
});

/**
 * Callable Function: adminSaveQuiz (Admin only)
 * Provisions or updates a complete quiz with question keys.
 */
export const adminSaveQuiz = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can manage quizzes.');
  }

  const { quiz, questions } = request.data || {};
  if (!quiz || typeof quiz !== 'object') {
    throw new HttpsError('invalid-argument', 'Valid quiz metadata object is required.');
  }

  const isPublishing = quiz.published === true;
  if (isPublishing) {
    const parseResult = publishedQuizSubmissionSchema.safeParse({ quiz, questions });
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Assessment publication validation failed.';
      throw new HttpsError('invalid-argument', `Cannot publish assessment: ${firstError}`);
    }
  } else {
    const parseResult = draftQuizSubmissionSchema.safeParse({ quiz, questions: questions || [] });
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Draft validation failed.';
      throw new HttpsError('invalid-argument', `Cannot save draft assessment: ${firstError}`);
    }
  }

  const db = admin.firestore();
  const quizId = quiz.id || db.collection('quizzes').doc().id;
  const now = new Date().toISOString();

  const batch = db.batch();
  const quizRef = db.collection('quizzes').doc(quizId);

  batch.set(
    quizRef,
    {
      ...quiz,
      id: quizId,
      published: Boolean(quiz.published),
      questionsCount: Array.isArray(questions) ? questions.length : 0,
      updatedAt: now,
      createdAt: quiz.createdAt || now,
    },
    { merge: true }
  );

  // Write question subcollection
  if (Array.isArray(questions)) {
    for (const q of questions) {
      const qId = q.id || quizRef.collection('questions').doc().id;
      const qRef = quizRef.collection('questions').doc(qId);
      batch.set(qRef, {
        ...q,
        id: qId,
        quizId,
        subjectId: quiz.subjectId,
      });
    }
  }

  await batch.commit();

  return {
    success: true,
    quizId,
    published: Boolean(quiz.published),
  };
});

/**
 * Callable Function: adminDeleteQuiz (Admin only)
 */
export const adminDeleteQuiz = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can delete quizzes.');
  }

  const { quizId } = request.data || {};
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
export const adminUpdateTopicStatus = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  if (request.auth.token.role !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Only administrators can update syllabus topics.');
  }

  const { topicId, status, completedAt } = request.data as {
    topicId: string;
    status: TopicStatus;
    completedAt?: string;
  };

  if (!topicId || !status) {
    throw new HttpsError('invalid-argument', 'topicId and status are required.');
  }

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
export const toggleStudentTopicProgress = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const { topicId, subjectId, completed } = request.data as {
    topicId: string;
    subjectId: string;
    completed: boolean;
  };

  if (!topicId || typeof completed !== 'boolean') {
    throw new HttpsError('invalid-argument', 'topicId and completed boolean are required.');
  }

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
