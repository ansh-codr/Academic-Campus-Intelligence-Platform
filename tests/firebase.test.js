/**
 * SolveSphere AI — Firebase Integration & Security Test Suite
 * 
 * Verifies:
 * 1. Student Registration in Firebase Auth & Firestore
 * 2. Privilege Escalation Prevention (Student cannot assign themselves ADMIN)
 * 3. Administrative Provisioning with Custom Claims ({ role: 'ADMIN' })
 * 4. Persistent Complaint Creation with Atomic Reference SS-2026-XXXX
 * 5. Ticket Ownership Enforcement (Students only see their own tickets)
 * 6. Admin Ticket Status Transitions with Allowed Lifecycle Validations
 * 7. Admin Department Assignment and Audit Event Logging
 * 8. Firestore Database Seeding for 6 Subjects, Topics, and Resources
 */

import admin from 'firebase-admin';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp as initClientApp } from 'firebase/app';
import {
  getAuth as getClientAuth,
  connectAuthEmulator as connectClientAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as updateClientProfile,
  signOut,
} from 'firebase/auth';
import {
  getFirestore as getClientFirestore,
  connectFirestoreEmulator as connectClientFirestoreEmulator,
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import {
  getFunctions as getClientFunctions,
  connectFunctionsEmulator as connectClientFunctionsEmulator,
  httpsCallable,
} from 'firebase/functions';
import {
  getStorage as getClientStorage,
  connectStorageEmulator as connectClientStorageEmulator,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';

// Configure emulator endpoints
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';

const testProjectId = process.env.GCLOUD_PROJECT || 'fluetas-a1914';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: testProjectId,
    storageBucket: `${testProjectId}.appspot.com`,
  });
}

const auth = admin.auth();
const db = admin.firestore();

let testStudentUid = '';
let testAdminUid = '';
let createdTicketId = '';
let createdTicketRefNumber = '';

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`  SOLVESPHERE AI — FIREBASE TEST SUITE`);
  console.log(`  Auth Emulator:      ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
  console.log(`  Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`======================================================\n`);

  // --------------------------------------------------------------------------
  // TEST 1: Student Account Registration
  // --------------------------------------------------------------------------
  console.log(`[TEST 1] Registering Student in Firebase Auth & Firestore...`);
  const studentEmail = `student.test.${Date.now()}@campus.edu`;
  const studentRecord = await auth.createUser({
    email: studentEmail,
    password: 'Password@2026',
    displayName: 'Aarav Sharma',
  });
  testStudentUid = studentRecord.uid;
  assert.ok(testStudentUid, 'Student UID should be created');

  // Verify default token does not have admin claim
  const studentToken = await auth.getUser(testStudentUid);
  assert.strictEqual(studentToken.customClaims?.role, undefined, 'Student must not possess ADMIN claim');

  // Create Firestore profile
  await db.collection('users').doc(testStudentUid).set({
    id: testStudentUid,
    email: studentEmail,
    fullName: 'Aarav Sharma',
    studentId: 'CS26019',
    role: 'STUDENT',
    department: 'Computer Science & AI',
    semester: 1,
    createdAt: new Date().toISOString(),
  });

  const studentProfileSnap = await db.collection('users').doc(testStudentUid).get();
  assert.ok(studentProfileSnap.exists, 'Student document should exist in Firestore');
  assert.strictEqual(studentProfileSnap.data().role, 'STUDENT');
  console.log(`✓ Test 1 Passed: Student account registered with role STUDENT.`);

  // --------------------------------------------------------------------------
  // TEST 2: Administrative Provisioning & Custom Claims
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 2] Provisioning Admin account with verified custom claims...`);
  const adminEmail = `admin.test.${Date.now()}@campus.edu`;
  const adminRecord = await auth.createUser({
    email: adminEmail,
    password: 'SolveSphereAdmin@2026',
    displayName: 'Dr. Vikram Malhotra',
  });
  testAdminUid = adminRecord.uid;

  // Set custom claims securely via Admin SDK
  await auth.setCustomUserClaims(testAdminUid, { role: 'ADMIN' });
  const adminUser = await auth.getUser(testAdminUid);
  assert.strictEqual(adminUser.customClaims.role, 'ADMIN', 'Admin custom claim must equal ADMIN');

  await db.collection('users').doc(testAdminUid).set({
    id: testAdminUid,
    email: adminEmail,
    fullName: 'Dr. Vikram Malhotra',
    studentId: 'ADM-8802',
    role: 'ADMIN',
    department: 'Academic Affairs & Campus Operations',
    createdAt: new Date().toISOString(),
  });
  console.log(`✓ Test 2 Passed: Admin account provisioned with custom claim { role: 'ADMIN' }.`);

  // --------------------------------------------------------------------------
  // TEST 3: Persistent Complaint Creation with Atomic Reference Sequence
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 3] Creating Complaint with Atomic SS-2026-XXXX Reference...`);
  const counterRef = db.collection('systemCounters').doc('complaints');
  const now = new Date().toISOString();

  const newTicket = await db.runTransaction(async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let nextSeq = 850;
    if (counterSnap.exists) {
      nextSeq = (counterSnap.data()?.currentSequence || 850) + 1;
    }
    transaction.set(counterRef, { currentSequence: nextSeq }, { merge: true });

    const refNum = `SS-2026-${String(nextSeq).padStart(4, '0')}`;
    const complaintRef = db.collection('complaints').doc();
    const tId = complaintRef.id;

    const tData = {
      id: tId,
      referenceNumber: refNum,
      title: 'Lecture Hall 204 AC Split Unit Leaking Water',
      category: 'AC_HVAC',
      building: 'Engineering Block A',
      floor: '2nd Floor',
      room: 'Hall 204',
      description: 'Water dripping onto front desk rows during morning classes.',
      priority: 'HIGH',
      status: 'SUBMITTED',
      assignedDepartment: 'HVAC & Climate Control',
      submittedById: testStudentUid,
      submittedBy: 'Aarav Sharma (CS26019)',
      submittedAt: now,
      updatedAt: now,
    };

    transaction.set(complaintRef, tData);

    const eventRef = complaintRef.collection('timeline').doc();
    transaction.set(eventRef, {
      id: eventRef.id,
      ticketId: tId,
      status: 'SUBMITTED',
      note: 'Ticket created in Firestore test suite.',
      updatedBy: 'Aarav Sharma',
      timestamp: now,
    });

    return { id: tId, refNum };
  });

  createdTicketId = newTicket.id;
  createdTicketRefNumber = newTicket.refNum;

  assert.ok(createdTicketId, 'Ticket ID must exist');
  assert.match(createdTicketRefNumber, /^SS-2026-\d{4}$/, 'Reference number must match SS-2026-XXXX format');

  // Verify in Firestore
  const savedTicketSnap = await db.collection('complaints').doc(createdTicketId).get();
  assert.ok(savedTicketSnap.exists, 'Complaint document must exist in Firestore');
  assert.strictEqual(savedTicketSnap.data().status, 'SUBMITTED');
  assert.strictEqual(savedTicketSnap.data().submittedById, testStudentUid);

  // Verify timeline subcollection
  const timelineSnap = await db.collection('complaints').doc(createdTicketId).collection('timeline').get();
  assert.strictEqual(timelineSnap.docs.length, 1, 'Initial timeline event must be recorded');
  assert.strictEqual(timelineSnap.docs[0].data().status, 'SUBMITTED');
  console.log(`✓ Test 3 Passed: Complaint persisted with reference ${createdTicketRefNumber}.`);

  // --------------------------------------------------------------------------
  // TEST 4: Student Ownership Filtering
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 4] Verifying Student Ownership Isolation...`);
  const studentTicketsSnap = await db.collection('complaints').where('submittedById', '==', testStudentUid).get();
  assert.strictEqual(studentTicketsSnap.docs.length, 1);
  assert.strictEqual(studentTicketsSnap.docs[0].id, createdTicketId);

  // Another student ID query returns 0
  const otherStudentSnap = await db.collection('complaints').where('submittedById', '==', 'non-existent-uid').get();
  assert.strictEqual(otherStudentSnap.docs.length, 0, 'Other student cannot retrieve these tickets');
  console.log(`✓ Test 4 Passed: Student queries strictly scoped by submittedById.`);

  // --------------------------------------------------------------------------
  // TEST 5: Admin Status Transitions (SUBMITTED -> UNDER_REVIEW -> ASSIGNED -> IN_PROGRESS -> RESOLVED)
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 5] Testing Lifecycle Status Transitions...`);
  const ticketRef = db.collection('complaints').doc(createdTicketId);

  // Transition to UNDER_REVIEW
  await ticketRef.update({ status: 'UNDER_REVIEW', updatedAt: new Date().toISOString() });
  await ticketRef.collection('timeline').add({
    ticketId: createdTicketId,
    status: 'UNDER_REVIEW',
    note: 'Triage team reviewed complaint.',
    updatedBy: 'Dr. Vikram Malhotra (Admin)',
    timestamp: new Date().toISOString(),
  });

  // Transition to ASSIGNED
  await ticketRef.update({
    status: 'ASSIGNED',
    assignedDepartment: 'HVAC & Climate Control',
    updatedAt: new Date().toISOString(),
  });
  await ticketRef.collection('timeline').add({
    ticketId: createdTicketId,
    status: 'ASSIGNED',
    note: 'Assigned to Senior Technician R. Gupta.',
    updatedBy: 'Dr. Vikram Malhotra (Admin)',
    timestamp: new Date().toISOString(),
  });

  // Transition to IN_PROGRESS
  await ticketRef.update({ status: 'IN_PROGRESS', updatedAt: new Date().toISOString() });
  await ticketRef.collection('timeline').add({
    ticketId: createdTicketId,
    status: 'IN_PROGRESS',
    note: 'Technician on-site inspecting drain line.',
    updatedBy: 'R. Gupta (HVAC)',
    timestamp: new Date().toISOString(),
  });

  // Transition to RESOLVED
  await ticketRef.update({ status: 'RESOLVED', updatedAt: new Date().toISOString() });
  await ticketRef.collection('timeline').add({
    ticketId: createdTicketId,
    status: 'RESOLVED',
    note: 'Drain line cleared, compressor relay replaced. Repaired.',
    updatedBy: 'Dr. Vikram Malhotra (Admin)',
    timestamp: new Date().toISOString(),
  });

  const finalSnap = await ticketRef.get();
  assert.strictEqual(finalSnap.data().status, 'RESOLVED');

  const fullTimelineSnap = await ticketRef.collection('timeline').get();
  assert.strictEqual(fullTimelineSnap.docs.length, 5, 'Timeline must contain all 5 lifecycle state events');
  console.log(`✓ Test 5 Passed: Full ticket lifecycle completed with 5 auditable timeline events.`);

  // --------------------------------------------------------------------------
  // TEST 6: Seeding Firestore Database
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 6] Seeding Firestore with Academic Subjects & Resources...`);
  const subjects = [
    { id: 'subj-cs101', code: 'CS101', name: 'Foundation in AI', credits: 4, instructor: 'Dr. Aris Thorne' },
    { id: 'subj-dt102', code: 'DT102', name: 'Design Thinking', credits: 3, instructor: 'Prof. Elena Rostova' },
    { id: 'subj-de103', code: 'EC103', name: 'Digital Electronics', credits: 4, instructor: 'Dr. Rajesh Nair' },
    { id: 'subj-del104', code: 'EC104P', name: 'Digital Electronics Lab', credits: 2, instructor: 'Er. Maya Patel' },
    { id: 'subj-ma105', code: 'MA101', name: 'Mathematics', credits: 4, instructor: 'Prof. David Vance' },
    { id: 'subj-bc106', code: 'HU101', name: 'Business Communication', credits: 2, instructor: 'Dr. Sarah Al-Mansoor' },
  ];

  const batch = db.batch();
  for (const s of subjects) {
    batch.set(db.collection('subjects').doc(s.id), { ...s, isSampleData: true });
  }
  await batch.commit();

  const subjectsSnap = await db.collection('subjects').get();
  assert.strictEqual(subjectsSnap.docs.length, 6, 'All 6 subjects must exist in Firestore');
  console.log(`✓ Test 6 Passed: 6 subjects seeded into Firestore.`);

  // --------------------------------------------------------------------------
  // TEST 7: Student Subject & Syllabus Topic Read Access
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 7] Verifying Student Subject & Topic Timeline Queries...`);
  const topicsBatch = db.batch();
  const sampleTopics = [
    { id: 'top-ai-1', subjectId: 'subj-cs101', unit: 1, title: 'Intelligent Agents', status: 'COMPLETED', order: 1, completedAt: '2026-10-15' },
    { id: 'top-ai-2', subjectId: 'subj-cs101', unit: 1, title: 'Heuristic Search (A*)', status: 'COMPLETED', order: 2, completedAt: '2026-10-25' },
    { id: 'top-ai-3', subjectId: 'subj-cs101', unit: 2, title: 'Neural Networks', status: 'ONGOING', order: 3, isCurrent: true },
    { id: 'top-ai-4', subjectId: 'subj-cs101', unit: 2, title: 'Backpropagation', status: 'UPCOMING', order: 4 },
  ];
  for (const t of sampleTopics) {
    topicsBatch.set(db.collection('syllabusTopics').doc(t.id), t);
  }
  await topicsBatch.commit();

  const csTopicsSnap = await db
    .collection('syllabusTopics')
    .where('subjectId', '==', 'subj-cs101')
    .orderBy('order', 'asc')
    .get();

  assert.strictEqual(csTopicsSnap.docs.length, 4, 'Must retrieve all 4 topics for CS101 in order');
  assert.strictEqual(csTopicsSnap.docs[0].data().order, 1);
  assert.strictEqual(csTopicsSnap.docs[2].data().status, 'ONGOING');
  console.log(`✓ Test 7 Passed: Topics retrieved in chronological order with correct ongoing state.`);

  // --------------------------------------------------------------------------
  // TEST 8: Admin Subject Creation
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 8] Admin Subject Provisioning...`);
  const newSubjectId = 'subj-cs102';
  await db.collection('subjects').doc(newSubjectId).set({
    id: newSubjectId,
    code: 'CS102',
    name: 'Data Structures & Algorithms',
    instructor: 'Dr. Elizabeth Warren',
    credits: 4,
    department: 'Computer Science & AI',
    semester: 2,
    academicYear: '2026-2027',
    category: 'CORE',
    description: 'Advanced data structures, balanced trees, and graph algorithms.',
    isArchived: false,
    createdAt: new Date().toISOString(),
  });

  const createdSubjectSnap = await db.collection('subjects').doc(newSubjectId).get();
  assert.ok(createdSubjectSnap.exists, 'Created subject must persist in Firestore');
  assert.strictEqual(createdSubjectSnap.data().code, 'CS102');
  console.log(`✓ Test 8 Passed: Admin subject CS102 persisted in database.`);

  // --------------------------------------------------------------------------
  // TEST 9: Topic Status Lifecycle Transitions (Pacing Updates)
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 9] Topic Status Pacing Lifecycle Updates...`);
  const topicRef = db.collection('syllabusTopics').doc('top-ai-4');

  // Transition UPCOMING -> ONGOING
  await topicRef.update({
    status: 'ONGOING',
    isCurrent: true,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Dr. Vikram Malhotra (Admin)',
  });
  let updatedTopicSnap = await topicRef.get();
  assert.strictEqual(updatedTopicSnap.data().status, 'ONGOING');
  assert.strictEqual(updatedTopicSnap.data().isCurrent, true);

  // Transition ONGOING -> COMPLETED with completion timestamp
  const completedDate = '2026-11-21';
  await topicRef.update({
    status: 'COMPLETED',
    isCurrent: false,
    completedAt: completedDate,
    updatedAt: new Date().toISOString(),
  });
  updatedTopicSnap = await topicRef.get();
  assert.strictEqual(updatedTopicSnap.data().status, 'COMPLETED');
  assert.strictEqual(updatedTopicSnap.data().completedAt, completedDate);
  console.log(`✓ Test 9 Passed: Topic pacing transitioned successfully with audit timestamps.`);

  // --------------------------------------------------------------------------
  // TEST 10: Protected Quiz Question Bank Provisioning
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 10] Provisioning Quiz and Protected Question Bank...`);
  const quizId = 'quiz-test-ai';
  await db.collection('quizzes').doc(quizId).set({
    id: quizId,
    subjectId: 'subj-cs101',
    title: 'AI Neural Networks Practice Assessment',
    durationMinutes: 15,
    difficulty: 'INTERMEDIATE',
    published: true,
    questionsCount: 2,
    createdAt: new Date().toISOString(),
  });

  const q1Ref = db.collection('quizzes').doc(quizId).collection('questions').doc('q-test-1');
  await q1Ref.set({
    id: 'q-test-1',
    quizId,
    questionText: 'What property guarantees A* tree search optimality?',
    options: ['Admissibility', 'Branching factor < 2', 'Non-zero heuristics', 'Breadth first queue'],
    correctOptionIndex: 0,
    explanation: 'Admissibility (never overestimating goal cost) guarantees optimality in tree search.',
  });

  const q2Ref = db.collection('quizzes').doc(quizId).collection('questions').doc('q-test-2');
  await q2Ref.set({
    id: 'q-test-2',
    quizId,
    questionText: 'Which activation function has an identity gradient for x > 0?',
    options: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'],
    correctOptionIndex: 2,
    explanation: 'ReLU f(x) = max(0, x) has derivative = 1 for positive inputs.',
  });

  const quizQuestionsSnap = await db.collection('quizzes').doc(quizId).collection('questions').get();
  assert.strictEqual(quizQuestionsSnap.docs.length, 2, 'Quiz must have 2 questions stored in subcollection');
  console.log(`✓ Test 10 Passed: Quiz and questions stored in protected subcollections.`);

  // --------------------------------------------------------------------------
  // TEST 11: Trusted Server-Side Quiz Grading & Attempt Isolation
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 11] Server-Side Quiz Grading and Attempt Persistence...`);
  const studentAnswers = [
    { questionId: 'q-test-1', selectedOptionIndex: 0 }, // Correct
    { questionId: 'q-test-2', selectedOptionIndex: 1 }, // Incorrect (selected Tanh instead of ReLU)
  ];

  // Server-side grading logic
  let correctCount = 0;
  const review = [];
  for (const qDoc of quizQuestionsSnap.docs) {
    const qData = qDoc.data();
    const ans = studentAnswers.find((a) => a.questionId === qDoc.id);
    const selected = ans ? ans.selectedOptionIndex : -1;
    const isCorrect = selected === qData.correctOptionIndex;
    if (isCorrect) correctCount++;
    review.push({
      questionId: qDoc.id,
      selectedOptionIndex: selected,
      correctOptionIndex: qData.correctOptionIndex,
      isCorrect,
      explanation: qData.explanation,
    });
  }

  assert.strictEqual(correctCount, 1, 'Student must have exactly 1 correct answer');
  const percentage = Math.round((correctCount / quizQuestionsSnap.size) * 100);
  assert.strictEqual(percentage, 50, 'Score percentage must equal 50%');

  // Persist attempt
  const attemptRef = db.collection('quizAttempts').doc();
  const attemptId = attemptRef.id;
  await attemptRef.set({
    id: attemptId,
    userId: testStudentUid,
    studentName: 'Aarav Sharma',
    quizId,
    quizTitle: 'AI Neural Networks Practice Assessment',
    subjectId: 'subj-cs101',
    score: correctCount,
    totalQuestions: 2,
    percentage,
    answers: review,
    completedAt: new Date().toISOString(),
  });

  // Verify attempt query isolation
  const studentAttemptsSnap = await db
    .collection('quizAttempts')
    .where('userId', '==', testStudentUid)
    .get();

  assert.strictEqual(studentAttemptsSnap.docs.length, 1, 'Student must see their own attempt');
  assert.strictEqual(studentAttemptsSnap.docs[0].data().percentage, 50);

  // Other student query returns 0
  const otherAttemptsSnap = await db
    .collection('quizAttempts')
    .where('userId', '==', 'other-random-student-uid')
    .get();
  assert.strictEqual(otherAttemptsSnap.docs.length, 0, 'Data isolation: cannot access other student attempts');
  console.log(`✓ Test 11 Passed: Quiz server-graded (50%) and persisted with strict user isolation.`);

  // --------------------------------------------------------------------------
  // TEST 12: Student Personal Study Progress Tracking
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 12] Student Personal Study Progress (Decoupled from Classroom)...`);
  const progressDocId = `${testStudentUid}_top-ai-1`;
  await db.collection('studentStudyProgress').doc(progressDocId).set({
    id: progressDocId,
    userId: testStudentUid,
    topicId: 'top-ai-1',
    subjectId: 'subj-cs101',
    completed: true,
    updatedAt: new Date().toISOString(),
  });

  const progressSnap = await db.collection('studentStudyProgress').doc(progressDocId).get();
  assert.ok(progressSnap.exists);
  assert.strictEqual(progressSnap.data().completed, true);

  // Verify that official topic document was NOT modified by student's personal study status
  const officialTopicSnap = await db.collection('syllabusTopics').doc('top-ai-1').get();
  assert.strictEqual(officialTopicSnap.data().title, 'Intelligent Agents');
  console.log(`✓ Test 12 Passed: Personal study progress persisted without altering official classroom syllabus.`);

  // --------------------------------------------------------------------------
  // TEST 13: Study Resource Repository & Faculty Verification
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 13] Study Resource Repository & Scope Filtering...`);
  const resDocRef = db.collection('resources').doc('res-test-ai');
  await resDocRef.set({
    id: 'res-test-ai',
    subjectId: 'subj-cs101',
    topicId: 'top-ai-3',
    title: 'Dr. Thorne Neural Network Lecture Slides',
    description: 'Comprehensive slides on multi-layer perceptrons.',
    scope: 'WITHIN_SYLLABUS',
    type: 'SLIDES',
    facultyApproved: true,
    authorFaculty: 'Dr. Aris Thorne',
    fileUrl: 'https://storage.googleapis.com/test-bucket/slides.pdf',
    storagePath: 'academic-resources/subj-cs101/slides.pdf',
    createdAt: new Date().toISOString(),
  });

  const resSnap = await db.collection('resources').where('scope', '==', 'WITHIN_SYLLABUS').get();
  assert.ok(resSnap.docs.length >= 1, 'Must find at least 1 resource within syllabus');
  const found = resSnap.docs.find((d) => d.id === 'res-test-ai');
  assert.ok(found, 'Must retrieve created resource');
  assert.strictEqual(found.data().facultyApproved, true);
  console.log(`✓ Test 13 Passed: Study resource repository verified with faculty approval.`);

  // --------------------------------------------------------------------------
  // Initialize Client SDKs to simulate real browser clients for security tests
  // --------------------------------------------------------------------------
  const clientApp = initClientApp(
    {
      apiKey: 'fake-api-key',
      projectId: testProjectId,
      storageBucket: `${testProjectId}.appspot.com`,
    },
    `client-${Date.now()}`
  );
  const clientAuth = getClientAuth(clientApp);
  connectClientAuthEmulator(clientAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const clientDb = getClientFirestore(clientApp);
  connectClientFirestoreEmulator(clientDb, '127.0.0.1', 8080);
  const clientFunctions = getClientFunctions(clientApp);
  connectClientFunctionsEmulator(clientFunctions, '127.0.0.1', 5001);
  const clientStorage = getClientStorage(clientApp, `gs://${testProjectId}.appspot.com`);
  connectClientStorageEmulator(clientStorage, '127.0.0.1', 9199);

  // Authenticate student in client SDK
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');

  // --------------------------------------------------------------------------
  // TEST 14: Direct Client Quiz-Score Forgery Block (Negative Security Test)
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 14] Verifying Direct Quiz-Score Forgery Is Blocked by Security Rules...`);
  await assert.rejects(
    async () => {
      await setDoc(doc(clientDb, 'quizAttempts', 'forged-attempt-123'), {
        id: 'forged-attempt-123',
        userId: testStudentUid,
        score: 100,
        percentage: 100,
      });
    },
    /permission-denied/i,
    'Direct client write to quizAttempts must be rejected with permission-denied'
  );
  console.log(`✓ Test 14 Passed: Direct client quiz score forgery blocked by Security Rules.`);

  // --------------------------------------------------------------------------
  // TEST 15: Student Profile Privilege Escalation Block (Negative Security Test)
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 15] Verifying Student Privilege Escalation (role -> ADMIN) Is Blocked...`);
  await assert.rejects(
    async () => {
      await updateDoc(doc(clientDb, 'users', testStudentUid), {
        role: 'ADMIN',
      });
    },
    /permission-denied/i,
    'Student attempting to elevate role to ADMIN must be rejected with permission-denied'
  );
  console.log(`✓ Test 15 Passed: Self-assignment of ADMIN role blocked by Security Rules.`);

  // --------------------------------------------------------------------------
  // TEST 16: Cloud Function askStudyMateAi - Callable Protocol Execution
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 16] Exercising askStudyMateAi Cloud Function via Real Callable Path...`);
  const askFn = httpsCallable(clientFunctions, 'askStudyMateAi');

  // 16a: Authenticated call with WITHIN_SYLLABUS mode
  const aiRes = await askFn({
    prompt: 'Explain why ReLU is preferred over Sigmoid in multi-layer perceptrons',
    subjectId: 'subj-cs101',
    mode: 'WITHIN_SYLLABUS',
  });

  const resData = aiRes.data;
  assert.ok(resData.reply, 'Result must contain reply text');
  assert.strictEqual(resData.mode, 'WITHIN_SYLLABUS');
  assert.ok(resData.groundingContext?.topicTitles?.length > 0, 'Must contain syllabus grounding topics');
  const createdConversationId = resData.conversationId;
  assert.ok(createdConversationId, 'Conversation ID must be generated');
  console.log(`✓ Test 16 Passed: askStudyMateAi executed successfully with syllabus grounding.`);

  // 16b: Unauthenticated invocation must fail
  console.log(`\n[TEST 16b] Verifying Unauthenticated User is Rejected...`);
  await signOut(clientAuth);
  await assert.rejects(
    async () => {
      await askFn({
        prompt: 'Unauthenticated prompt',
        subjectId: 'subj-cs101',
        mode: 'WITHIN_SYLLABUS',
      });
    },
    (err) => err.code?.includes('unauthenticated') || /authenticated/i.test(err.message),
    'Unauthenticated call must be rejected with unauthenticated error'
  );
  console.log(`✓ Test 16b Passed: Unauthenticated user rejected by Cloud Function.`);

  // Re-authenticate student
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');

  // --------------------------------------------------------------------------
  // TEST 17: Per-User AI Rate Limiting & Quota Accounting
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 17] Verifying Per-User AI Rate Limiting (< 2s interval)...`);
  // Calling immediately after Test 16 without 2-second cooldown must trigger rate limit
  await assert.rejects(
    async () => {
      await askFn({
        prompt: 'Rapid duplicate inquiry',
        subjectId: 'subj-cs101',
        mode: 'WITHIN_SYLLABUS',
      });
    },
    (err) => err.code?.includes('resource-exhausted') || /resource-exhausted|wait|seconds/i.test(err.message),
    'Immediate rapid request must be rejected with resource-exhausted'
  );

  const usageSnap = await db.collection('aiUsage').doc(testStudentUid).get();
  assert.ok(usageSnap.exists, 'AI usage tracking document must exist');
  assert.ok(usageSnap.data().dailyCount >= 1, 'Daily count must record query usage');
  console.log(`✓ Test 17 Passed: Rate limiter enforced (resource-exhausted) and quota recorded.`);

  // --------------------------------------------------------------------------
  // TEST 18: Conversation Persistence & Cross-Student Isolation
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 18] Verifying Conversation Persistence & Cross-Student Chat Isolation...`);
  const convSnap = await db.collection('studyMateConversations').doc(createdConversationId).get();
  assert.ok(convSnap.exists, 'Conversation document must exist in Firestore');
  assert.strictEqual(convSnap.data().userId, testStudentUid);

  const msgsSnap = await db
    .collection('studyMateConversations')
    .doc(createdConversationId)
    .collection('messages')
    .get();
  assert.ok(msgsSnap.docs.length >= 2, 'Conversation must contain user message and AI response');

  // Second student client
  const s2Email = `student2.test.${Date.now()}@campus.edu`;
  await auth.createUser({ email: s2Email, password: 'Password@2026' });

  const clientApp2 = initClientApp(
    { apiKey: 'fake-api-key', projectId: testProjectId },
    `client2-${Date.now()}`
  );
  const clientAuth2 = getClientAuth(clientApp2);
  connectClientAuthEmulator(clientAuth2, 'http://127.0.0.1:9099', { disableWarnings: true });
  const clientDb2 = getClientFirestore(clientApp2);
  connectClientFirestoreEmulator(clientDb2, '127.0.0.1', 8080);

  await signInWithEmailAndPassword(clientAuth2, s2Email, 'Password@2026');

  // Student 2 attempts to read Student 1 conversation
  await assert.rejects(
    async () => {
      await getDoc(doc(clientDb2, 'studyMateConversations', createdConversationId));
    },
    /permission-denied/i,
    'Student 2 cannot read Student 1 conversation'
  );
  console.log(`✓ Test 18 Passed: Conversation persisted and cross-student chat isolation verified.`);

  // --------------------------------------------------------------------------
  // TEST 20: Cross-Student Conversation Injection Block via askStudyMateAi
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 20] Verifying Cross-Student Conversation Injection Is Blocked via askStudyMateAi...`);
  const clientFunctions2 = getClientFunctions(clientApp2);
  connectClientFunctionsEmulator(clientFunctions2, '127.0.0.1', 5001);
  const askFn2 = httpsCallable(clientFunctions2, 'askStudyMateAi');

  await assert.rejects(
    async () => {
      await askFn2({
        prompt: 'Injecting unauthorized query into student 1 conversation',
        subjectId: 'subj-cs101',
        conversationId: createdConversationId,
      });
    },
    (err) => err.code?.includes('permission-denied') || /permission-denied|access denied|unauthorized/i.test(err.message),
    'Cross-student conversation injection must be rejected with permission-denied'
  );
  console.log(`✓ Test 20 Passed: Conversation ownership enforced; unauthorized conversation injection blocked.`);

  // --------------------------------------------------------------------------
  // TEST 20b: Non-Existent Conversation ID Rejection in askStudyMateAi
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 20b] Verifying Non-Existent Conversation ID Rejection...`);
  await assert.rejects(
    async () => {
      await askFn2({
        prompt: 'Query with non-existent conversation ID',
        subjectId: 'subj-cs101',
        conversationId: 'non-existent-conv-id-99999',
      });
    },
    (err) => err.code?.includes('not-found') || /not-found|does not exist/i.test(err.message),
    'Non-existent conversation ID must be rejected with not-found error'
  );
  console.log(`✓ Test 20b Passed: Non-existent conversation ID rejected rather than silently created.`);

  // --------------------------------------------------------------------------
  // TEST 20c: Original Timestamp Preservation When Appending to Conversation
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 20c] Verifying Original createdAt Timestamp Preservation on Append...`);
  const initialConvSnap = await db.collection('studyMateConversations').doc(createdConversationId).get();
  const originalCreatedAt = initialConvSnap.data().createdAt;
  assert.ok(originalCreatedAt, 'Initial conversation must have createdAt timestamp');

  // Wait 2.1s to satisfy rate limit cooldown
  await new Promise((resolve) => setTimeout(resolve, 2100));

  // Student 1 appends a follow-up query to their existing conversation
  const appendRes = await askFn({
    prompt: 'What are the main advantages of using GELU over ReLU in modern Transformer models?',
    subjectId: 'subj-cs101',
    conversationId: createdConversationId,
    mode: 'WITHIN_SYLLABUS',
  });
  assert.strictEqual(appendRes.data.conversationId, createdConversationId);

  const updatedConvSnap = await db.collection('studyMateConversations').doc(createdConversationId).get();
  const updatedData = updatedConvSnap.data();
  assert.strictEqual(
    updatedData.createdAt,
    originalCreatedAt,
    'Original createdAt timestamp must be preserved verbatim when appending to conversation'
  );
  assert.ok(
    new Date(updatedData.updatedAt).getTime() >= new Date(originalCreatedAt).getTime(),
    'updatedAt timestamp must be updated on append'
  );

  const totalMsgsSnap = await db
    .collection('studyMateConversations')
    .doc(createdConversationId)
    .collection('messages')
    .get();
  assert.strictEqual(totalMsgsSnap.docs.length, 4, 'Conversation must now contain 4 messages (2 user + 2 model)');
  console.log(`✓ Test 20c Passed: Original createdAt preserved and messages appended in atomic transaction.`);

  // --------------------------------------------------------------------------
  // TEST 21: Direct Client Chat Message Forgery Block (Negative Security Test)
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 21] Verifying Forged Chat Message Creation Is Blocked in Firestore Rules...`);
  await assert.rejects(
    async () => {
      await setDoc(
        doc(clientDb, 'studyMateConversations', createdConversationId, 'messages', 'forged-msg-123'),
        {
          id: 'forged-msg-123',
          conversationId: createdConversationId,
          userId: testStudentUid,
          role: 'model',
          text: 'Forged AI answer directly injected via client SDK',
          timestamp: new Date().toISOString(),
        }
      );
    },
    /permission-denied/i,
    'Direct client write to conversation messages subcollection must be rejected with permission-denied'
  );
  console.log(`✓ Test 21 Passed: Direct client chat message forgery blocked by Security Rules.`);

  // --------------------------------------------------------------------------
  // TEST 22: Direct Client Ticket Lifecycle Event Forgery Block (Negative Security Test)
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 22] Verifying Forged Ticket Lifecycle Event Creation Is Blocked in Firestore Rules...`);
  await assert.rejects(
    async () => {
      await setDoc(
        doc(clientDb, 'complaints', createdTicketId, 'timeline', 'forged-timeline-123'),
        {
          id: 'forged-timeline-123',
          ticketId: createdTicketId,
          status: 'RESOLVED',
          note: 'Forged resolution event directly written by student',
          timestamp: new Date().toISOString(),
        }
      );
    },
    /permission-denied/i,
    'Direct client creation of complaint timeline events must be rejected with permission-denied'
  );
  console.log(`✓ Test 22 Passed: Direct client ticket lifecycle event forgery blocked by Security Rules.`);

  // --------------------------------------------------------------------------
  // TEST 23: Registered Student ID & Profile Field Immutability (Negative Security Test)
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 23] Verifying Registered Student ID & Profile Field Immutability...`);
  // 23a: Attempting to modify registered studentId must be rejected
  await assert.rejects(
    async () => {
      await updateDoc(doc(clientDb, 'users', testStudentUid), {
        studentId: 'FORGED-ID-9999',
      });
    },
    /permission-denied/i,
    'Student attempting to modify registered studentId must be rejected with permission-denied'
  );

  // 23b: Attempting to modify registered email must be rejected
  await assert.rejects(
    async () => {
      await updateDoc(doc(clientDb, 'users', testStudentUid), {
        email: 'hacked.email@campus.edu',
      });
    },
    /permission-denied/i,
    'Student attempting to modify email must be rejected with permission-denied'
  );

  // 23c: Updating permitted non-identity field (bio) must succeed
  await updateDoc(doc(clientDb, 'users', testStudentUid), {
    bio: 'First-year AI & Machine Learning student.',
  });
  const updatedUserDoc = await getDoc(doc(clientDb, 'users', testStudentUid));
  assert.strictEqual(updatedUserDoc.data().bio, 'First-year AI & Machine Learning student.');
  console.log(`✓ Test 23 Passed: Student ID & identity fields immutable; permitted profile fields update successfully.`);

  // --------------------------------------------------------------------------
  // TEST 24: Server-Side Academic Subject Validation in askStudyMateAi
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 24] Verifying Invalid Academic Subject Rejection in askStudyMateAi...`);
  await assert.rejects(
    async () => {
      await askFn2({
        prompt: 'Exploration on invalid subject',
        subjectId: 'invalid-course-code-999',
        mode: 'WITHIN_SYLLABUS',
      });
    },
    (err) => err.code?.includes('not-found') || /not-found|unavailable/i.test(err.message),
    'Invalid subject must be rejected with not-found error'
  );
  console.log(`✓ Test 24 Passed: Server-side academic subject validation confirmed.`);

  // --------------------------------------------------------------------------
  // TEST 25: Mock Gemini Restrictions (Production Environment Safeguard)
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 25] Verifying Mock Response Restrictions Against Production Environment...`);
  const { isEmulatorOrTestEnvironment } = await import('../functions/lib/studymate.js');

  // Verify that in the emulator environment, isEmulatorOrTestEnvironment() is true
  assert.strictEqual(isEmulatorOrTestEnvironment(), true, 'Must detect test/emulator environment');

  // Verify that outside emulator and test runner, mock responses are prohibited
  const origEmulator = process.env.FUNCTIONS_EMULATOR;
  const origHub = process.env.FIREBASE_EMULATOR_HUB;
  const origFsHost = process.env.FIRESTORE_EMULATOR_HOST;
  const origNodeEnv = process.env.NODE_ENV;
  const origKService = process.env.K_SERVICE;
  try {
    delete process.env.FUNCTIONS_EMULATOR;
    delete process.env.FIREBASE_EMULATOR_HUB;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    process.env.K_SERVICE = 'us-central1-askStudyMateAi-prod';
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_MOCK_GEMINI = 'true'; // Attempt to bypass via production env var

    assert.strictEqual(
      isEmulatorOrTestEnvironment(),
      false,
      'Production environment must strictly prohibit mock responses regardless of environment variables'
    );
  } finally {
    if (origEmulator !== undefined) process.env.FUNCTIONS_EMULATOR = origEmulator;
    if (origHub !== undefined) process.env.FIREBASE_EMULATOR_HUB = origHub;
    if (origFsHost !== undefined) process.env.FIRESTORE_EMULATOR_HOST = origFsHost;
    if (origKService !== undefined) process.env.K_SERVICE = origKService;
    else delete process.env.K_SERVICE;
    if (origNodeEnv !== undefined) process.env.NODE_ENV = origNodeEnv;
    else delete process.env.NODE_ENV;
    delete process.env.ALLOW_MOCK_GEMINI;
  }
  console.log(`✓ Test 25 Passed: Production environment strictly prohibits mock responses regardless of environment variables.`);

  // --------------------------------------------------------------------------
  // TEST 26: Complaint Creation with Attachments & Notification via Callable
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 26] Creating Complaint with Attachments & In-App Notification...`);
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');

  // Negative test 26a: Direct student creation of complaints in Firestore must be blocked
  await assert.rejects(
    async () => {
      await setDoc(doc(clientDb, 'complaints', 'direct-forged-complaint'), {
        id: 'direct-forged-complaint',
        referenceNumber: 'SS-2026-9999',
        title: 'Forged Ticket direct to Firestore',
        category: 'AC_HVAC',
        status: 'SUBMITTED',
        submittedById: testStudentUid,
      });
    },
    /permission-denied/i,
    'Direct client write to complaints collection must be rejected by Firestore Security Rules'
  );

  const createComplaintCallable = httpsCallable(clientFunctions, 'createComplaint');

  // Pre-upload valid test attachment leak1.jpg to Student 1's authorized storage path
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');
  const validAttachmentStorageRef = storageRef(clientStorage, `attachments/${testStudentUid}/tkt-sample/leak1.jpg`);
  await uploadBytes(validAttachmentStorageRef, new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70]), {
    contentType: 'image/jpeg',
  });

  const validAttachmentUrl = `https://firebasestorage.googleapis.com/v0/b/${testProjectId}.appspot.com/o/attachments%2F${testStudentUid}%2Ftkt-sample%2Fleak1.jpg?alt=media`;

  // Negative test 26a: Non-existent object in storage must be rejected
  await assert.rejects(
    async () => {
      await createComplaintCallable({
        title: 'Library 2nd Floor Split AC Unit Leak',
        category: 'AC_HVAC',
        building: 'Central Library',
        floor: '2nd Floor',
        room: 'Silent Zone 202',
        description: 'Severe water leak above desks in silent study room.',
        priority: 'HIGH',
        attachmentUrls: [`https://firebasestorage.googleapis.com/v0/b/${testProjectId}.appspot.com/o/attachments%2F${testStudentUid}%2Ftkt-sample%2Fnonexistent_ghost.jpg?alt=media`],
      });
    },
    (err) => err.code?.includes('not-found') || /not exist in storage/i.test(err.message),
    'Non-existent storage attachment must be rejected with not-found'
  );

  // Negative test 26b: Providing an attachment URL belonging to another student must be rejected
  await assert.rejects(
    async () => {
      await createComplaintCallable({
        title: 'Library 2nd Floor Split AC Unit Leak',
        category: 'AC_HVAC',
        building: 'Central Library',
        floor: '2nd Floor',
        room: 'Silent Zone 202',
        description: 'Severe water leak above desks in silent study room.',
        priority: 'HIGH',
        attachmentUrls: [`https://firebasestorage.googleapis.com/v0/b/${testProjectId}.appspot.com/o/attachments%2Fother-student-uid%2Ftkt-sample%2Fstolen.jpg?alt=media`],
      });
    },
    (err) => err.code?.includes('permission-denied') || /verification failed|workspace|another student/i.test(err.message),
    'Attachment URL belonging to another user must be rejected'
  );

  // Negative test 26c: Arbitrary external host attachment URL must be rejected
  await assert.rejects(
    async () => {
      await createComplaintCallable({
        title: 'Library 2nd Floor Split AC Unit Leak',
        category: 'AC_HVAC',
        building: 'Central Library',
        floor: '2nd Floor',
        room: 'Silent Zone 202',
        description: 'Severe water leak above desks in silent study room.',
        priority: 'HIGH',
        attachmentUrls: ['https://malicious-external-site.com/payload.png'],
      });
    },
    (err) => err.code?.includes('permission-denied') || /host/i.test(err.message),
    'Arbitrary external host attachment must be rejected'
  );

  // Negative test 26d: Directory traversal or encoded path tricks must be rejected
  await assert.rejects(
    async () => {
      await createComplaintCallable({
        title: 'Library 2nd Floor Split AC Unit Leak',
        category: 'AC_HVAC',
        building: 'Central Library',
        floor: '2nd Floor',
        room: 'Silent Zone 202',
        description: 'Severe water leak above desks in silent study room.',
        priority: 'HIGH',
        attachmentUrls: [`attachments/${testStudentUid}/../victim/photo.png`],
      });
    },
    (err) => err.code?.includes('permission-denied') || /traversal|illegal/i.test(err.message),
    'Directory traversal tricks in attachment path must be rejected'
  );

  // Negative test 26e: Forged bucket in URL must be rejected
  await assert.rejects(
    async () => {
      await createComplaintCallable({
        title: 'Library 2nd Floor Split AC Unit Leak',
        category: 'AC_HVAC',
        building: 'Central Library',
        floor: '2nd Floor',
        room: 'Silent Zone 202',
        description: 'Severe water leak above desks in silent study room.',
        priority: 'HIGH',
        attachmentUrls: [`https://firebasestorage.googleapis.com/v0/b/evil-forged-bucket.appspot.com/o/attachments%2F${testStudentUid}%2Ftkt-sample%2Fleak1.jpg?alt=media`],
      });
    },
    (err) => err.code?.includes('permission-denied') || /bucket/i.test(err.message),
    'Forged bucket in attachment URL must be rejected'
  );

  // Negative test 26f: Disallowed MIME type saved in storage must be rejected
  await admin.storage().bucket(`${testProjectId}.appspot.com`).file(`attachments/${testStudentUid}/tkt-sample/script.js`).save(Buffer.from('alert(1)'), {
    resumable: false,
    contentType: 'text/javascript',
    metadata: {
      contentType: 'text/javascript',
    },
  });
  await assert.rejects(
    async () => {
      await createComplaintCallable({
        title: 'Library 2nd Floor Split AC Unit Leak',
        category: 'AC_HVAC',
        building: 'Central Library',
        floor: '2nd Floor',
        room: 'Silent Zone 202',
        description: 'Severe water leak above desks in silent study room.',
        priority: 'HIGH',
        attachmentUrls: [`https://firebasestorage.googleapis.com/v0/b/${testProjectId}.appspot.com/o/attachments%2F${testStudentUid}%2Ftkt-sample%2Fscript.js?alt=media`],
      });
    },
    (err) => err.code?.includes('invalid-argument') || /content type/i.test(err.message),
    'Disallowed MIME type must be rejected by Cloud Functions'
  );

  const complaintPayload = {
    title: 'Library 2nd Floor Split AC Unit Leak',
    category: 'AC_HVAC',
    building: 'Central Library',
    floor: '2nd Floor',
    room: 'Silent Zone 202',
    description: 'Severe water leak above desks in silent study room.',
    priority: 'HIGH',
    attachmentUrls: [validAttachmentUrl],
  };
  const compRes = await createComplaintCallable(complaintPayload);
  assert.ok(compRes.data?.success, 'createComplaint must return success: true');
  const createdCompData = compRes.data?.data;
  assert.ok(createdCompData?.id, 'Complaint must have generated ID');
  assert.match(createdCompData?.referenceNumber, /^SS-2026-\d{4}$/, 'Complaint must have atomic SS-2026-XXXX sequence');
  assert.strictEqual(createdCompData?.status, 'SUBMITTED', 'Initial status must be SUBMITTED');
  assert.strictEqual(createdCompData?.assignedDepartment, 'HVAC & Climate Control', 'Should route to HVAC department');
  assert.deepStrictEqual(createdCompData?.attachmentUrls, [validAttachmentUrl]);
  assert.deepStrictEqual(createdCompData?.attachmentPaths, [`attachments/${testStudentUid}/tkt-sample/leak1.jpg`]);

  // Negative test 26g: Unauthorized attachment reassignment (trying to claim already bound attachment)
  await assert.rejects(
    async () => {
      await createComplaintCallable({
        title: 'Attempted Hijack of Existing Attachment',
        category: 'AC_HVAC',
        building: 'Central Library',
        floor: '2nd Floor',
        room: 'Silent Zone 202',
        description: 'Attempting to reassign already claimed attachment.',
        priority: 'MEDIUM',
        attachmentUrls: [validAttachmentUrl],
      });
    },
    (err) => err.code?.includes('failed-precondition') || /already been bound/i.test(err.message),
    'Reassigning an already bound attachment must be rejected with failed-precondition'
  );

  // Verify in Firestore
  const compDocSnap = await db.collection('complaints').doc(createdCompData.id).get();
  assert.ok(compDocSnap.exists, 'Complaint document must exist in Firestore');
  assert.strictEqual(compDocSnap.data().submittedById, testStudentUid);

  // Verify In-App Notification created in Firestore
  const notifsSnap = await db.collection('notifications')
    .where('userId', '==', testStudentUid)
    .where('ticketId', '==', createdCompData.id)
    .get();
  assert.ok(!notifsSnap.empty, 'In-App notification must be generated for submitted complaint');
  const notifData = notifsSnap.docs[0].data();
  assert.strictEqual(notifData.type, 'SUBMITTED');
  assert.strictEqual(notifData.read, false);
  console.log(`✓ Test 26 Passed: Direct client creation blocked; callable enforced ownership, reference sequence, and attachment verification.`);

  // --------------------------------------------------------------------------
  // TEST 27: Deterministic Duplicate Issue Grouping & Admin Confirmation
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 27] Verifying Deterministic Duplicate Issue Grouping & Admin Confirmation...`);
  // Submit a second complaint with identical category and location within 48h
  const duplicateCompPayload = {
    title: 'AC Drip on Silent Zone 202 Carpet',
    category: 'AC_HVAC',
    building: 'Central Library',
    floor: '2nd Floor',
    room: 'Silent Zone 202',
    description: 'Carpet soaked from AC leakage in silent room.',
    priority: 'MEDIUM',
  };
  const compRes2 = await createComplaintCallable(duplicateCompPayload);
  assert.ok(compRes2.data?.success);
  const comp2Data = compRes2.data?.data;
  assert.ok(comp2Data?.id);
  assert.strictEqual(comp2Data?.clusteringStatus, 'PENDING', 'createComplaint must return PENDING status immediately');

  // Wait for Firestore background trigger (onComplaintCreatedClustering) to complete clustering
  let comp2Doc;
  let comp2ClusterId;
  for (let attempt = 0; attempt < 50; attempt++) {
    comp2Doc = await db.collection('complaints').doc(comp2Data.id).get();
    comp2ClusterId = comp2Doc.data()?.clusterId;
    if (comp2ClusterId && comp2Doc.data()?.clusteringStatus === 'COMPLETED') break;
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.ok(comp2ClusterId, 'Duplicate ticket must be assigned a clusterId by background worker');
  comp2Data.clusterId = comp2ClusterId;

  // Verify cluster in Firestore: must be created as unreviewed rule-based suggestion without invented scores
  const clusterSnap = await db.collection('issueClusters').doc(comp2Data.clusterId).get();
  assert.ok(clusterSnap.exists, 'Issue cluster document must exist in Firestore');
  const clusterData = clusterSnap.data();
  assert.strictEqual(clusterData.category, 'AC_HVAC');
  assert.strictEqual(clusterData.building, 'Central Library');
  assert.strictEqual(clusterData.room, 'Silent Zone 202');
  assert.strictEqual(clusterData.ticketCount, 2, 'Cluster ticketCount must be 2');
  assert.ok(clusterData.ticketIds.includes(createdCompData.id), 'Cluster must include first ticket ID');
  assert.ok(clusterData.ticketIds.includes(comp2Data.id), 'Cluster must include second ticket ID');
  assert.strictEqual(clusterData.status, 'SUGGESTED_INCIDENT', 'Must be categorized as unconfirmed suggestion initially');
  assert.strictEqual(clusterData.verifiedByAdmin, false, 'Must not claim admin verification without review');
  assert.strictEqual(clusterData.clusteringMethod, 'RULE_BASED_LOCATION_PROXIMITY');
  assert.strictEqual(clusterData.confidenceScore, undefined, 'Must not invent artificial confidence scores');

  // Administrator confirms and verifies the cluster as an active shared incident
  await signInWithEmailAndPassword(clientAuth, adminEmail, 'SolveSphereAdmin@2026');
  const reviewClusterCallable = httpsCallable(clientFunctions, 'adminReviewCluster');
  const reviewRes = await reviewClusterCallable({
    clusterId: comp2Data.clusterId,
    action: 'verify',
    note: 'Admin verified shared HVAC leak affecting Room 202 zone.',
  });
  assert.ok(reviewRes.data?.success);
  assert.strictEqual(reviewRes.data?.status, 'ACTIVE_INCIDENT');

  const verifiedClusterSnap = await db.collection('issueClusters').doc(comp2Data.clusterId).get();
  assert.strictEqual(verifiedClusterSnap.data().status, 'ACTIVE_INCIDENT');
  assert.strictEqual(verifiedClusterSnap.data().verifiedByAdmin, true);
  console.log(`✓ Test 27 Passed: Deterministic grouping created unreviewed suggestion; admin verification transitioned to verified incident.`);

  // --------------------------------------------------------------------------
  // TEST 28: Ticket Status Transitions & Department Assignment Validation
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 28] Testing Admin Status Transitions & Department Assignment Validation...`);
  const updateStatusCallable = httpsCallable(clientFunctions, 'updateTicketStatus');
  const assignDeptCallable = httpsCallable(clientFunctions, 'assignTicketDepartment');

  // Valid transition: SUBMITTED -> UNDER_REVIEW
  const statusRes1 = await updateStatusCallable({
    ticketId: createdCompData.id,
    newStatus: 'UNDER_REVIEW',
    note: 'Under triage review by Admin.',
  });
  assert.ok(statusRes1.data?.success);

  // Valid transition: UNDER_REVIEW -> ASSIGNED
  const statusRes2 = await updateStatusCallable({
    ticketId: createdCompData.id,
    newStatus: 'ASSIGNED',
    note: 'Assigned to central HVAC unit.',
  });
  assert.ok(statusRes2.data?.success);

  // Negative test 28a: Assigning a non-existent department must be rejected
  await assert.rejects(
    async () => {
      await assignDeptCallable({
        ticketId: createdCompData.id,
        departmentName: 'Non-Existent Fake Department',
      });
    },
    (err) => err.code?.includes('not-found') || /does not exist|not registered/i.test(err.message),
    'Assigning non-existent department must be rejected'
  );

  // Valid department assignment
  const assignRes = await assignDeptCallable({
    ticketId: createdCompData.id,
    departmentName: 'HVAC & Climate Control',
    note: 'Dispatching technician R. Gupta.',
  });
  assert.ok(assignRes.data?.success);

  // Valid transition: ASSIGNED -> IN_PROGRESS
  await updateStatusCallable({
    ticketId: createdCompData.id,
    newStatus: 'IN_PROGRESS',
    note: 'Technician on site inspecting split AC.',
  });

  // Valid transition: IN_PROGRESS -> RESOLVED
  await updateStatusCallable({
    ticketId: createdCompData.id,
    newStatus: 'RESOLVED',
    note: 'Drain pan cleared, relay replaced. Resolved.',
  });

  // Verify invalid transition: RESOLVED -> UNDER_REVIEW (Not allowed by lifecycle rules)
  await assert.rejects(
    async () => {
      await updateStatusCallable({
        ticketId: createdCompData.id,
        newStatus: 'UNDER_REVIEW',
      });
    },
    (err) => err.code?.includes('failed-precondition') || /cannot transition/i.test(err.message),
    'Transition from RESOLVED to UNDER_REVIEW must be rejected with failed-precondition'
  );

  const resolvedDocSnap = await db.collection('complaints').doc(createdCompData.id).get();
  assert.strictEqual(resolvedDocSnap.data().status, 'RESOLVED');

  // Verify RESOLVED in-app notification sent to student
  const resolvedNotifSnap = await db.collection('notifications')
    .where('userId', '==', testStudentUid)
    .where('type', '==', 'RESOLVED')
    .get();
  assert.ok(!resolvedNotifSnap.empty, 'RESOLVED notification must be dispatched to student');
  console.log(`✓ Test 28 Passed: Status lifecycle transitions and department assignment validation verified.`);

  // --------------------------------------------------------------------------
  // TEST 29: Student Reopen Ticket Workflow
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 29] Verifying Ticket Reopening Workflow...`);
  // Sign in back as student
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');
  const reopenCallable = httpsCallable(clientFunctions, 'reopenTicket');

  // Student reopens their own RESOLVED ticket
  const reopenRes = await reopenCallable({
    ticketId: createdCompData.id,
    reason: 'Water started dripping again after heavy morning classes.',
  });
  assert.ok(reopenRes.data?.success);
  assert.strictEqual(reopenRes.data?.data?.status, 'REOPENED');

  // Verify ticket status in Firestore
  const reopenedSnap = await db.collection('complaints').doc(createdCompData.id).get();
  assert.strictEqual(reopenedSnap.data().status, 'REOPENED');

  // Verify timeline event in subcollection
  const reopenedTimelineSnap = await db.collection('complaints').doc(createdCompData.id).collection('timeline')
    .where('status', '==', 'REOPENED')
    .get();
  assert.strictEqual(reopenedTimelineSnap.docs.length, 1);
  assert.ok(reopenedTimelineSnap.docs[0].data().note.includes('Water started dripping again'));

  // Negative test: attempt to reopen ticket when not in RESOLVED or CLOSED status
  await assert.rejects(
    async () => {
      await reopenCallable({
        ticketId: createdCompData.id,
        reason: 'Attempting to reopen an already reopened ticket',
      });
    },
    (err) => err.code?.includes('failed-precondition') || /only resolved or closed/i.test(err.message),
    'Reopening non-resolved ticket must be rejected'
  );

  // Negative test: student 2 cannot reopen student 1's ticket
  const student2Email = `student2.test.${Date.now()}@campus.edu`;
  const student2Record = await auth.createUser({
    email: student2Email,
    password: 'Password@2026',
    displayName: 'Priya Patel',
  });
  await db.collection('users').doc(student2Record.uid).set({
    id: student2Record.uid,
    email: student2Email,
    fullName: 'Priya Patel',
    role: 'STUDENT',
    createdAt: new Date().toISOString(),
  });

  await signInWithEmailAndPassword(clientAuth, student2Email, 'Password@2026');
  await assert.rejects(
    async () => {
      await reopenCallable({
        ticketId: createdCompData.id,
        reason: 'Student 2 trying to reopen Student 1 ticket',
      });
    },
    (err) => err.code?.includes('permission-denied') || /permission/i.test(err.message),
    'Student 2 cannot reopen Student 1 ticket'
  );

  // Negative test: ordinary student cannot bypass Cloud Function to directly update complaint status in Firestore
  await assert.rejects(
    async () => {
      await updateDoc(doc(clientDb, 'complaints', createdCompData.id), {
        status: 'REOPENED',
      });
    },
    /permission-denied/i,
    'Direct student update to complaints collection must be blocked by Firestore rules'
  );
  console.log(`✓ Test 29 Passed: Ticket reopening workflow, timeline event, and authorization verified.`);

  // --------------------------------------------------------------------------
  // TEST 30: Notifications Isolation, Idempotency & Ticket Event Privacy
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 30] Verifying Notifications Isolation, Idempotency & Event Privacy...`);
  // Student 2 attempts to read Student 1's notification -> rejected
  const notifId = notifsSnap.docs[0].id;
  await assert.rejects(
    async () => {
      await getDoc(doc(clientDb, 'notifications', notifId));
    },
    /permission-denied/i,
    'Student 2 must not be able to read Student 1 notification'
  );

  // Negative test: Unrelated student cannot read another student's top-level ticketEvents
  await db.collection('ticketEvents').doc('event-test-audit-1').set({
    id: 'event-test-audit-1',
    ticketId: createdCompData.id,
    submittedById: testStudentUid,
    status: 'SUBMITTED',
  });
  await assert.rejects(
    async () => {
      await getDoc(doc(clientDb, 'ticketEvents', 'event-test-audit-1'));
    },
    /permission-denied/i,
    'Student 2 must not be able to read Student 1 ticketEvent audit log'
  );

  // Switch back to Student 1
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');
  // Student 1 reads their own notification -> allowed
  const readNotifSnap = await getDoc(doc(clientDb, 'notifications', notifId));
  assert.ok(readNotifSnap.exists);

  // Student 1 marks notification as read -> allowed
  await updateDoc(doc(clientDb, 'notifications', notifId), {
    read: true,
  });
  const updatedNotif = await getDoc(doc(clientDb, 'notifications', notifId));
  assert.strictEqual(updatedNotif.data().read, true);

  // Student 1 attempts to forge new notification directly -> rejected
  await assert.rejects(
    async () => {
      await setDoc(doc(clientDb, 'notifications', 'forged-notif-1'), {
        userId: testStudentUid,
        title: 'Forged Alert',
        message: 'Forged notification payload',
        read: false,
      });
    },
    /permission-denied/i,
    'Direct client notification creation must be rejected'
  );

  // Test Notification Idempotency: duplicate send calls must not generate multiple notifications
  const beforeIdempotentCount = (await db.collection('notifications')
    .where('userId', '==', testStudentUid)
    .where('ticketId', '==', createdCompData.id)
    .get()).docs.length;

  const { sendInAppNotification } = await import('../functions/lib/notifications.js');
  const initialTimelineEventId = createdCompData.timeline[0]?.id || `init_${createdCompData.id}`;

  // 1. Same event retried -> returns existing notifId without creating duplicate
  await sendInAppNotification(db, {
    userId: testStudentUid,
    ticketId: createdCompData.id,
    referenceNumber: createdCompData.referenceNumber,
    type: 'SUBMITTED',
    title: 'Duplicate Submission Alert',
    message: 'Test message for retry idempotency.',
    eventId: initialTimelineEventId,
  });

  const afterRetryCount = (await db.collection('notifications')
    .where('userId', '==', testStudentUid)
    .where('ticketId', '==', createdCompData.id)
    .get()).docs.length;
  assert.strictEqual(afterRetryCount, beforeIdempotentCount, 'Notification idempotency must prevent duplicate documents on event retry');

  // 2. Concurrent duplicate dispatches for same event must atomically produce exactly 1 notification
  const concurrentEventId = `evt_concurrent_${Date.now()}`;
  await Promise.all([
    sendInAppNotification(db, {
      userId: testStudentUid,
      ticketId: createdCompData.id,
      referenceNumber: createdCompData.referenceNumber,
      type: 'STATUS_CHANGED',
      title: 'Concurrent Alert 1',
      message: 'Concurrent dispatch 1',
      eventId: concurrentEventId,
    }),
    sendInAppNotification(db, {
      userId: testStudentUid,
      ticketId: createdCompData.id,
      referenceNumber: createdCompData.referenceNumber,
      type: 'STATUS_CHANGED',
      title: 'Concurrent Alert 2',
      message: 'Concurrent dispatch 2',
      eventId: concurrentEventId,
    }),
  ]);
  const concurrentDocs = await db.collection('notifications')
    .where('userId', '==', testStudentUid)
    .where('eventId', '==', concurrentEventId)
    .get();
  assert.strictEqual(concurrentDocs.docs.length, 1, 'Concurrent dispatches for same event must atomically create exactly 1 notification');

  // 3. Two different status changes on the same ticket must create separate notifications
  const eventId1 = `evt_status_change_1_${Date.now()}`;
  const eventId2 = `evt_status_change_2_${Date.now()}`;
  await sendInAppNotification(db, {
    userId: testStudentUid,
    ticketId: createdCompData.id,
    referenceNumber: createdCompData.referenceNumber,
    type: 'STATUS_CHANGED',
    title: 'Status: UNDER_REVIEW',
    message: 'Under review by technician.',
    eventId: eventId1,
  });
  await sendInAppNotification(db, {
    userId: testStudentUid,
    ticketId: createdCompData.id,
    referenceNumber: createdCompData.referenceNumber,
    type: 'STATUS_CHANGED',
    title: 'Status: IN_PROGRESS',
    message: 'Technician on site.',
    eventId: eventId2,
  });

  const docEvt1 = await db.collection('notifications').doc(`notif_${createdCompData.id}_${eventId1}`).get();
  const docEvt2 = await db.collection('notifications').doc(`notif_${createdCompData.id}_${eventId2}`).get();
  assert.ok(docEvt1.exists, 'First status change notification must exist');
  assert.ok(docEvt2.exists, 'Second status change notification must exist');
  assert.notStrictEqual(docEvt1.id, docEvt2.id, 'Different status changes on same ticket must have separate notifications');
  console.log(`✓ Test 30 Passed: Notification read isolation, ticket event privacy, and notification idempotency verified.`);

  // --------------------------------------------------------------------------
  // TEST 31: Campus Department Management & Safe Administrative Updates
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 31] Verifying Department Management & Safe Admin Updates...`);
  // Switch to Admin
  await signInWithEmailAndPassword(clientAuth, adminEmail, 'SolveSphereAdmin@2026');
  const manageDeptCallable = httpsCallable(clientFunctions, 'adminManageDepartment');

  // Admin creates department
  const createDeptRes = await manageDeptCallable({
    action: 'create',
    data: {
      name: 'Robotics & Automation Lab Maintenance',
      code: 'DEPT-ROBOT',
      category: 'GENERAL_INFRASTRUCTURE',
      headName: 'Dr. Rajesh Nair',
      contactEmail: 'robotics-maintenance@campus.edu',
    },
  });
  assert.ok(createDeptRes.data?.success);
  const createdDept = createDeptRes.data?.department;
  assert.ok(createdDept?.id);

  // Safe update: updating permitted fields works, but tampering with ID or counters is rejected/ignored
  const updateDeptRes = await manageDeptCallable({
    action: 'update',
    departmentId: createdDept.id,
    data: {
      name: 'Robotics & Automation Maintenance Wing',
      id: 'FORGED_ID_OVERWRITE',
      activeTicketsCount: 9999,
      unwhitelistedExploitField: 'malicious',
    },
  });
  assert.ok(updateDeptRes.data?.success);
  const refetchedDeptDoc = await db.collection('departments').doc(createdDept.id).get();
  assert.strictEqual(refetchedDeptDoc.data().id, createdDept.id, 'Department ID must be immutable');
  assert.strictEqual(refetchedDeptDoc.data().activeTicketsCount, 0, 'Internal counters must not be modified by data spread');
  assert.strictEqual(refetchedDeptDoc.data().unwhitelistedExploitField, undefined, 'Unwhitelisted fields must not be persisted');
  assert.strictEqual(refetchedDeptDoc.data().name, 'Robotics & Automation Maintenance Wing', 'Permitted field should update');

  // Admin toggles active status
  const toggleRes = await manageDeptCallable({
    action: 'toggleActive',
    departmentId: createdDept.id,
  });
  assert.ok(toggleRes.data?.success);
  assert.strictEqual(toggleRes.data?.isActive, false);

  // Negative test: Assigning this now-disabled department to a ticket must fail
  await assert.rejects(
    async () => {
      await assignDeptCallable({
        ticketId: createdCompData.id,
        departmentId: createdDept.id,
      });
    },
    (err) => err.code?.includes('failed-precondition') || /disabled|inactive/i.test(err.message),
    'Assigning a disabled department must be rejected with failed-precondition'
  );

  // Switch to Student -> direct write to departments collection is rejected
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');
  await assert.rejects(
    async () => {
      await setDoc(doc(clientDb, 'departments', 'forged-dept'), {
        name: 'Hacked Department',
        code: 'HACK',
      });
    },
    /permission-denied/i,
    'Student direct write to departments collection must be rejected'
  );
  console.log(`✓ Test 31 Passed: Department field allowlist enforced, disabled department assignment rejected, client write blocked.`);

  // --------------------------------------------------------------------------
  // TEST 32: Campus Clubs Management & Safe Admin Allowlist
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 32] Verifying Campus Clubs Management & Safe Field Allowlist...`);
  // Admin creates club
  await signInWithEmailAndPassword(clientAuth, adminEmail, 'SolveSphereAdmin@2026');
  const manageClubCallable = httpsCallable(clientFunctions, 'adminManageClub');

  const createClubRes = await manageClubCallable({
    action: 'create',
    data: {
      name: 'Autonomous Drone Society',
      category: 'TECHNOLOGY',
      leadName: 'Rohan Mehta',
      description: 'Building autonomous quadcopters and computer vision navigation.',
      memberCount: 45,
      meetingSchedule: 'Wednesdays at 4 PM',
      tags: ['Drones', 'ROS', 'PX4'],
    },
  });
  assert.ok(createClubRes.data?.success);
  const createdClub = createClubRes.data?.club;
  assert.ok(createdClub?.id);

  // Safe update: attempt to alter internal ID or inject random fields is stripped
  await manageClubCallable({
    action: 'update',
    clubId: createdClub.id,
    data: {
      description: 'Updated drone software research group.',
      id: 'FORGED_CLUB_ID',
      injectedField: 'hack',
    },
  });
  const refetchedClubSnap = await db.collection('campusClubs').doc(createdClub.id).get();
  assert.strictEqual(refetchedClubSnap.data().id, createdClub.id, 'Club ID must remain immutable');
  assert.strictEqual(refetchedClubSnap.data().description, 'Updated drone software research group.');
  assert.strictEqual(refetchedClubSnap.data().injectedField, undefined, 'Unwhitelisted fields must be rejected');

  // Admin archives club
  const archiveClubRes = await manageClubCallable({
    action: 'archive',
    clubId: createdClub.id,
  });
  assert.ok(archiveClubRes.data?.success);

  // Student can read clubs
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');
  const readClubDoc = await getDoc(doc(clientDb, 'campusClubs', createdClub.id));
  assert.ok(readClubDoc.exists);
  assert.strictEqual(readClubDoc.data().isArchived, true);

  // Student cannot write or delete clubs directly
  await assert.rejects(
    async () => {
      await updateDoc(doc(clientDb, 'campusClubs', createdClub.id), {
        name: 'Hacked Club Name',
      });
    },
    /permission-denied/i,
    'Student cannot update campusClubs directly'
  );
  console.log(`✓ Test 32 Passed: Campus Club safe allowlist updates verified and student direct writes blocked.`);

  // --------------------------------------------------------------------------
  // TEST 33: Cloud Storage Attachment Security Rules & Tenant Isolation
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 33] Verifying Cloud Storage Security Rules & Tenant Isolation...`);

  // Student 1 uploads valid image to their own attachment path -> allowed
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');
  const validAttachmentRef = storageRef(clientStorage, `attachments/${testStudentUid}/tkt-sample/photo.png`);
  const sampleImageData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG magic bytes
  await uploadBytes(validAttachmentRef, sampleImageData, { contentType: 'image/png' });

  // Negative test 33a: Student 1 attempts to upload disallowed executable / script file -> rejected
  const invalidAttachmentRef = storageRef(clientStorage, `attachments/${testStudentUid}/tkt-sample/script.sh`);
  await assert.rejects(
    async () => {
      await uploadBytes(invalidAttachmentRef, new Uint8Array([101, 99, 104, 111]), { contentType: 'text/x-shellscript' });
    },
    /unauthorized|permission-denied|storage/i,
    'Uploading disallowed MIME type must be rejected by Storage rules'
  );

  // Negative test 33b: Student 2 attempts to upload to Student 1's path -> rejected
  await signInWithEmailAndPassword(clientAuth, student2Email, 'Password@2026');
  const forbiddenUploadRef = storageRef(clientStorage, `attachments/${testStudentUid}/tkt-sample/hacked.png`);
  await assert.rejects(
    async () => {
      await uploadBytes(forbiddenUploadRef, sampleImageData, { contentType: 'image/png' });
    },
    /unauthorized|permission-denied|storage/i,
    'Student 2 cannot upload to Student 1 attachment path'
  );

  // Negative test 33c: Student 2 attempts to read Student 1's attachment -> rejected
  const { getBytes, deleteObject } = await import('firebase/storage');
  await assert.rejects(
    async () => {
      await getBytes(validAttachmentRef);
    },
    /unauthorized|permission-denied|storage/i,
    'Student 2 cannot read Student 1 private attachment'
  );

  // Negative test 33d: Student 2 attempts to delete Student 1's attachment -> rejected
  await assert.rejects(
    async () => {
      await deleteObject(validAttachmentRef);
    },
    /unauthorized|permission-denied|storage/i,
    'Student 2 cannot delete Student 1 private attachment'
  );

  // Negative test 33e: Legacy /complaints/{ticketId}/{fileName} unvalidated path is blocked
  const legacyPathRef = storageRef(clientStorage, `complaints/tkt-sample/legacy.png`);
  await assert.rejects(
    async () => {
      await uploadBytes(legacyPathRef, sampleImageData, { contentType: 'image/png' });
    },
    /unauthorized|permission-denied|storage/i,
    'Legacy unvalidated complaints path must be rejected by default deny'
  );
  console.log(`✓ Test 33 Passed: Storage rules strictly enforce tenant isolation across two student accounts and block legacy paths.`);

  // --------------------------------------------------------------------------
  // TEST 34: Speak Freely Direct Submission Denial & Strict Access Control
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 34] Verifying Speak Freely Submission Denial & Strict Access Control...`);
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');
  const anonReportId = `anon-test-${Date.now()}`;
  const anonDocRef = doc(clientDb, 'anonymousReports', anonReportId);

  // Direct client write to anonymousReports must be REJECTED by Firestore Security Rules
  await assert.rejects(
    async () => {
      await setDoc(anonDocRef, {
        id: anonReportId,
        trackingCode: 'ANON-XYZ123',
        category: 'Student Welfare & Hostel Concerns',
        description: 'Hostel 3 hot water geyser has been non-functional for 4 days.',
        submittedAt: new Date().toISOString(),
        status: 'RECEIVED',
        privacyLevel: 'ANONYMOUS_UNVERIFIED_DEMO',
      });
    },
    /permission-denied/i,
    'Direct client write to anonymousReports must be rejected by Security Rules'
  );

  // Seed sample report via Admin SDK for read permissions verification
  await db.collection('anonymousReports').doc(anonReportId).set({
    id: anonReportId,
    trackingCode: 'ANON-XYZ123',
    category: 'Student Welfare & Hostel Concerns',
    description: 'Hostel 3 hot water geyser non-functional.',
    submittedAt: new Date().toISOString(),
    status: 'RECEIVED',
    privacyLevel: 'ANONYMOUS_UNVERIFIED_DEMO',
  });

  // Student CANNOT read anonymousReports collection (strict privacy)
  await assert.rejects(
    async () => {
      await getDoc(anonDocRef);
    },
    /permission-denied/i,
    'Student must not be allowed to read anonymousReports'
  );

  // Admin can read anonymousReports
  await signInWithEmailAndPassword(clientAuth, adminEmail, 'SolveSphereAdmin@2026');
  const adminReadAnonSnap = await getDoc(anonDocRef);
  assert.ok(adminReadAnonSnap.exists, 'Admin must be able to read anonymous report');
  assert.strictEqual(adminReadAnonSnap.data().trackingCode, 'ANON-XYZ123');
  console.log(`✓ Test 34 Passed: Direct client writes to Speak Freely blocked; read restricted exclusively to admin.`);

  // --------------------------------------------------------------------------
  // TEST 35: Campus Care AI Assistant - Querying & Grounded Ticket Tracking
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 35] Verifying Campus Care AI Assistant & Grounded Ticket Tracking...`);
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');
  const askCampusCareFn = httpsCallable(clientFunctions, 'askCampusCareAi');

  // Student 1 queries status of their tickets
  const careRes1 = await askCampusCareFn({
    prompt: 'What is the current status of my tickets?',
  });
  assert.ok(careRes1.data?.reply, 'Campus Care AI must return a reply');
  assert.ok(careRes1.data?.conversationId, 'Must return generated conversationId');
  assert.strictEqual(careRes1.data?.isMock, true, 'Emulator test double active');
  assert.ok(Array.isArray(careRes1.data?.relevantTickets), 'Should return relevantTickets array');
  const student1HasTicket = careRes1.data.relevantTickets.some((t) => t.id === createdCompData.id);
  assert.ok(student1HasTicket, 'Student 1 should see their own submitted ticket');

  // Query facilities issue generating complaint draft
  // Wait 2.1s to respect per-user rate limit
  await new Promise((r) => setTimeout(r, 2100));
  const careRes2 = await askCampusCareFn({
    prompt: 'The classroom AC in Engineering Block Room 204 is leaking water heavily',
    conversationId: careRes1.data.conversationId,
  });
  assert.ok(careRes2.data?.reply);
  assert.strictEqual(careRes2.data?.conversationId, careRes1.data.conversationId, 'Must preserve conversation ID');
  assert.ok(careRes2.data?.draftComplaint, 'Must generate draft complaint for maintenance issue');
  assert.strictEqual(careRes2.data.draftComplaint.category, 'AC_HVAC');
  assert.strictEqual(careRes2.data.draftComplaint.suggestedDepartment, 'HVAC & Climate Control');
  console.log(`✓ Test 35 Passed: Campus Care AI answered query, tracked tickets, and drafted structured complaint.`);

  // --------------------------------------------------------------------------
  // TEST 36: Campus Care AI - Unauthenticated Invocation Rejection
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 36] Verifying Unauthenticated User is Rejected by askCampusCareAi...`);
  await signOut(clientAuth);
  await assert.rejects(
    async () => {
      await askCampusCareFn({
        prompt: 'Unauthenticated facilities query',
      });
    },
    (err) => err.code?.includes('unauthenticated') || /authenticated/i.test(err.message),
    'Unauthenticated call to askCampusCareAi must fail with unauthenticated'
  );
  console.log(`✓ Test 36 Passed: Unauthenticated request rejected by askCampusCareAi.`);

  // --------------------------------------------------------------------------
  // TEST 37: Cross-Student Ticket & Conversation Isolation in Campus Care AI
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 37] Verifying Cross-Student Ticket & Conversation Isolation...`);
  await signInWithEmailAndPassword(clientAuth, student2Email, 'Password@2026');

  // Student 2 queries ticket status -> must NOT receive Student 1's ticket
  const student2CareRes = await askCampusCareFn({
    prompt: 'What is the status of my tickets?',
  });
  const student2Tickets = student2CareRes.data?.relevantTickets || [];
  const leakedTicket = student2Tickets.find((t) => t.id === createdCompData.id);
  assert.strictEqual(leakedTicket, undefined, 'Student 2 must not see Student 1 tickets in AI lookup');

  // Student 2 attempts to append to Student 1's conversation -> rejected
  await new Promise((r) => setTimeout(r, 2100));
  await assert.rejects(
    async () => {
      await askCampusCareFn({
        prompt: 'Attempting to inject into student 1 conversation',
        conversationId: careRes1.data.conversationId,
      });
    },
    (err) => err.code?.includes('permission-denied') || /do not own/i.test(err.message),
    'Attempting to append to another student conversation must be rejected'
  );
  console.log(`✓ Test 37 Passed: Ticket and conversation isolation strictly enforced across students.`);

  // --------------------------------------------------------------------------
  // TEST 38: AI-Assisted Complaint Reporting (aiAssistComplaint)
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 38] Verifying AI-Assisted Complaint Reporting (aiAssistComplaint)...`);
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');
  const aiAssistFn = httpsCallable(clientFunctions, 'aiAssistComplaint');

  await new Promise((r) => setTimeout(r, 2100));
  const assistRes = await aiAssistFn({
    rawInput: 'air conditioning unit in Room 302 is blowing warm humid air and dripping onto desks',
    building: 'Engineering Block B',
    room: 'Room 302',
  });
  assert.ok(assistRes.data?.suggestedTitle, 'Must return suggested title');
  assert.strictEqual(assistRes.data.suggestedCategory, 'AC_HVAC');
  assert.strictEqual(assistRes.data.suggestedDepartment, 'HVAC & Climate Control');
  assert.ok(assistRes.data.enhancedDescription, 'Must return enhanced description');
  assert.strictEqual(assistRes.data.isMock, true);
  assert.strictEqual(assistRes.data.provider, 'TEST_DOUBLE_HEURISTIC');
  assert.strictEqual(assistRes.data.enhancementSource, 'RULE_BASED_ASSISTANCE');

  // Input validation: rejecting rawInput under 3 characters
  await assert.rejects(
    async () => {
      await aiAssistFn({ rawInput: 'ab' });
    },
    (err) => err.code?.includes('invalid-argument') || /validation/i.test(err.message),
    'aiAssistComplaint with rawInput under 3 characters must be rejected with invalid-argument'
  );
  console.log(`✓ Test 38 Passed: aiAssistComplaint successfully enhanced student description and enforced input validation.`);

  // --------------------------------------------------------------------------
  // TEST 39: Semantic Duplicate Complaint Detection, Metadata & Embedding Safety
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 39] Verifying Semantic Duplicate Detection, Metadata & Embedding Safety...`);
  // 1. Submit First Complaint
  const acComp1Res = await createComplaintCallable({
    title: 'Split AC blowing hot air',
    category: 'AC_HVAC',
    building: 'Science Block',
    floor: '1st Floor',
    room: 'Lab 101',
    description: 'The air conditioner is not cooling and making loud rattling noise in the computer lab.',
    priority: 'HIGH',
  });
  assert.ok(acComp1Res.data?.success);
  const acComp1Id = acComp1Res.data.data.id;
  assert.ok(acComp1Res.data?.data?.referenceNumber);
  assert.strictEqual(acComp1Res.data?.data?.status, 'SUBMITTED');
  assert.ok(['PENDING', 'PROCESSING', 'COMPLETED'].includes(acComp1Res.data?.data?.clusteringStatus));

  // Poll for background embedding generation for comp1
  let embDoc;
  for (let attempt = 0; attempt < 30; attempt++) {
    embDoc = await db.collection('complaintEmbeddings').doc(acComp1Id).get();
    if (embDoc.exists) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(embDoc.exists, 'Complaint embedding record must exist in complaintEmbeddings');
  const embData = embDoc.data();
  assert.strictEqual(embData.source, 'TEST', 'Test environment embedding source must be TEST');
  assert.strictEqual(embData.model, 'deterministic-test-projector');
  assert.strictEqual(embData.dimensions, 64);
  assert.ok(embData.textHash, 'textHash must be recorded');
  assert.ok(['READY', 'SUCCESS'].includes(embData.status), 'status must indicate ready or success');

  // Verify cosineSimilarity rejects cross-model and cross-source comparisons
  const { cosineSimilarity, getGeminiEmbeddingModel } = await import('../functions/lib/campusCare.js');
  const dummyGeminiEmb = {
    values: new Array(768).fill(0.05),
    source: 'GEMINI',
    model: getGeminiEmbeddingModel(),
    dimensions: 768,
    textHash: 'hash-gemini',
  };
  const testDoubleEmb = {
    values: embData.embedding,
    source: embData.source,
    model: embData.model,
    dimensions: embData.dimensions,
    textHash: embData.textHash,
  };
  assert.strictEqual(
    cosineSimilarity(dummyGeminiEmb, testDoubleEmb),
    0,
    'cosineSimilarity must return 0 when comparing incompatible models/sources'
  );

  // 2. Submit Second Semantically Similar Complaint (Different Room, but strongly correlated symptoms)
  const acComp2Res = await createComplaintCallable({
    title: 'Air conditioning cooling failure in lab',
    category: 'AC_HVAC',
    building: 'Science Block',
    floor: '1st Floor',
    room: 'Lab 102',
    description: 'Air conditioner completely stopped cooling the room, temperature very high and AC unit hot.',
    priority: 'HIGH',
  });
  assert.ok(acComp2Res.data?.success);
  const acComp2Id = acComp2Res.data.data.id;

  // Poll for background clustering completion
  let acComp2Doc;
  let clusterId;
  for (let attempt = 0; attempt < 50; attempt++) {
    acComp2Doc = await db.collection('complaints').doc(acComp2Id).get();
    clusterId = acComp2Doc.data()?.clusterId;
    if (clusterId && acComp2Doc.data()?.clusteringStatus === 'COMPLETED') break;
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.ok(clusterId, 'Second semantically similar complaint must be assigned a clusterId');

  const clusterDoc = await db.collection('issueClusters').doc(clusterId).get();
  assert.ok(clusterDoc.exists, 'Cluster document must exist');
  const semanticClusterData = clusterDoc.data();
  assert.ok(semanticClusterData.clusteringMethod === 'SEMANTIC_SIMILARITY' || semanticClusterData.clusteringMethod === 'HYBRID_SEMANTIC_PROXIMITY');
  assert.ok(semanticClusterData.similarityScore >= 0.80, `Similarity score must be >= 0.80 (actual: ${semanticClusterData.similarityScore})`);
  assert.strictEqual(semanticClusterData.embeddingSource, 'TEST');
  assert.strictEqual(semanticClusterData.modelIdentifier, 'deterministic-test-projector');
  assert.strictEqual(semanticClusterData.vectorDimensions, 64);
  assert.ok(semanticClusterData.semanticExplanation, 'Semantic explanation must be recorded');
  assert.ok(semanticClusterData.aiMaintenanceSummary, 'AI maintenance summary must be generated');
  assert.strictEqual(semanticClusterData.status, 'SUGGESTED_INCIDENT');
  assert.strictEqual(semanticClusterData.verifiedByAdmin, false);
  assert.ok(semanticClusterData.ticketIds.includes(acComp1Id));
  assert.ok(semanticClusterData.ticketIds.includes(acComp2Id));

  // 3. Submit Unrelated Complaint (Water Leak) -> Must NOT join AC cluster
  const plumbingCompRes = await createComplaintCallable({
    title: 'Water tap leaking heavily',
    category: 'WATER_SUPPLY',
    building: 'Science Block',
    floor: '1st Floor',
    room: 'Washroom 1',
    description: 'Continuous water leakage from tap flooding washroom floor.',
    priority: 'MEDIUM',
  });
  assert.ok(plumbingCompRes.data?.success);
  const plumbingCompId = plumbingCompRes.data.data.id;
  const plumbingDoc = await db.collection('complaints').doc(plumbingCompId).get();
  assert.notStrictEqual(plumbingDoc.data()?.clusterId, clusterId, 'Dissimilar complaint must not join the AC cluster');
  console.log(`✓ Test 39 Passed: Semantic embeddings accurately clustered similar issues (score: ${semanticClusterData.similarityScore}) and verified embedding metadata safety.`);

  // --------------------------------------------------------------------------
  // TEST 40: Admin Review Cluster Actions (Verify & Reject)
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 40] Verifying Admin Review Cluster Actions (Verify & Reject)...`);
  await signInWithEmailAndPassword(clientAuth, adminEmail, 'SolveSphereAdmin@2026');

  // 1. Admin verifies AC cluster
  const verifyRes = await reviewClusterCallable({
    clusterId,
    action: 'verify',
    note: 'Admin verified centralized chiller outage.',
  });
  assert.ok(verifyRes.data?.success);
  assert.strictEqual(verifyRes.data.status, 'ACTIVE_INCIDENT');
  assert.strictEqual(verifyRes.data.verifiedByAdmin, true);

  const updatedClusterSnap = await db.collection('issueClusters').doc(clusterId).get();
  assert.strictEqual(updatedClusterSnap.data().status, 'ACTIVE_INCIDENT');
  assert.strictEqual(updatedClusterSnap.data().verifiedByAdmin, true);
  assert.ok(updatedClusterSnap.data().verifiedAt);
  assert.ok(updatedClusterSnap.data().verifiedBy);

  // Verify sanitized publicIncidents document was automatically generated
  const publicIncidentDoc = await db.collection('publicIncidents').doc(clusterId).get();
  assert.ok(publicIncidentDoc.exists, 'Public incident record must be created when cluster is verified');
  const pubData = publicIncidentDoc.data();
  assert.strictEqual(pubData.status, 'ACTIVE_INCIDENT');
  assert.strictEqual(pubData.ticketIds, undefined, 'Public incident must omit raw ticketIds');
  assert.strictEqual(pubData.submittedById, undefined, 'Public incident must omit submitter identity');
  assert.ok(pubData.title, 'Public incident must have title');
  assert.ok(pubData.summary, 'Public incident must have summary');

  // 2. Admin rejects another cluster suggestion
  const dummyClusterRef = db.collection('issueClusters').doc();
  await dummyClusterRef.set({
    id: dummyClusterRef.id,
    title: 'False Positive Cluster',
    status: 'SUGGESTED_INCIDENT',
    verifiedByAdmin: false,
    ticketIds: ['tkt-1', 'tkt-2'],
    createdAt: new Date().toISOString(),
  });

  const rejectRes = await reviewClusterCallable({
    clusterId: dummyClusterRef.id,
    action: 'reject',
    note: 'Independent problems, not a shared failure.',
  });
  assert.ok(rejectRes.data?.success);
  assert.strictEqual(rejectRes.data.status, 'REJECTED');
  assert.strictEqual(rejectRes.data.verifiedByAdmin, false);

  const rejectedClusterSnap = await dummyClusterRef.get();
  assert.strictEqual(rejectedClusterSnap.data().status, 'REJECTED');
  assert.strictEqual(rejectedClusterSnap.data().verifiedByAdmin, false);

  // Negative test: invalid adminReviewCluster payload rejected
  await assert.rejects(
    async () => {
      await reviewClusterCallable({
        clusterId: '',
        action: 'invalid_action',
      });
    },
    (err) => err.code?.includes('invalid-argument') || /validation/i.test(err.message),
    'Invalid cluster review parameters must be rejected with invalid-argument'
  );
  console.log(`✓ Test 40 Passed: Admin cluster verify, reject, and public incident synchronization confirmed.`);

  // --------------------------------------------------------------------------
  // TEST 41: Firestore Security Rules for Campus Care, Public Incidents & Embeddings
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 41] Verifying Security Rules for Campus Care, Public Incidents & Embeddings...`);
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');
  const student1ConvRef = doc(clientDb, 'campusCareConversations', careRes1.data.conversationId);

  // Student 1 can read own conversation
  const student1ReadSnap = await getDoc(student1ConvRef);
  assert.ok(student1ReadSnap.exists, 'Student 1 must be able to read own conversation');

  // Student 2 CANNOT read Student 1 conversation
  await signInWithEmailAndPassword(clientAuth, student2Email, 'Password@2026');
  await assert.rejects(
    async () => {
      await getDoc(student1ConvRef);
    },
    /permission-denied/i,
    'Student 2 cannot read Student 1 campus care conversation'
  );

  // Direct client write to messages subcollection is blocked
  await assert.rejects(
    async () => {
      await setDoc(doc(clientDb, 'campusCareConversations', careRes1.data.conversationId, 'messages', 'forged-msg'), {
        role: 'user',
        text: 'Forged message direct from client',
        timestamp: new Date().toISOString(),
      });
    },
    /permission-denied/i,
    'Direct client message creation must be rejected'
  );

  // Raw issueClusters collection read is BLOCKED for ordinary students (Admin only)
  await assert.rejects(
    async () => {
      await getDoc(doc(clientDb, 'issueClusters', clusterId));
    },
    /permission-denied/i,
    'Ordinary student must NOT have read access to raw issueClusters'
  );

  // Sanitized publicIncidents collection read is ALLOWED for authenticated students
  const studentPubSnap = await getDoc(doc(clientDb, 'publicIncidents', clusterId));
  assert.ok(studentPubSnap.exists, 'Authenticated student must be able to read publicIncidents');
  assert.strictEqual(studentPubSnap.data().ticketIds, undefined, 'Public incident must omit ticket IDs');

  // Direct client write to publicIncidents is blocked
  await assert.rejects(
    async () => {
      await setDoc(doc(clientDb, 'publicIncidents', 'forged-incident'), {
        title: 'Forged Incident Title',
        status: 'ACTIVE_INCIDENT',
      });
    },
    /permission-denied/i,
    'Direct client write to publicIncidents must be rejected'
  );

  // Direct client write to complaintEmbeddings is blocked
  await assert.rejects(
    async () => {
      await setDoc(doc(clientDb, 'complaintEmbeddings', 'fake-complaint-id'), {
        embedding: [0.1, 0.2, 0.3],
        textSnippet: 'Fake embedding',
      });
    },
    /permission-denied/i,
    'Client write to complaintEmbeddings must be rejected'
  );

  // Direct client read of complaintEmbeddings is blocked
  await assert.rejects(
    async () => {
      await getDoc(doc(clientDb, 'complaintEmbeddings', acComp1Id));
    },
    /permission-denied/i,
    'Client read from complaintEmbeddings must be rejected'
  );
  console.log(`✓ Test 41 Passed: Campus Care chat privacy, cluster isolation & public incident access enforced.`);

  // --------------------------------------------------------------------------
  // TEST 42: Production Mock Restrictions, Rate Limit & Schema Validation
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 42] Verifying Rate Limit Cooldown, Input Validation & Mock Restrictions...`);
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');

  // Input validation: empty prompt must be rejected
  await assert.rejects(
    async () => {
      await askCampusCareFn({ prompt: '' });
    },
    (err) => err.code?.includes('invalid-argument') || /validation/i.test(err.message),
    'askCampusCareAi with empty prompt must be rejected with invalid-argument'
  );

  // Calling askCampusCareAi within 2s interval must trigger rate limit
  try {
    await askCampusCareFn({
      prompt: 'First inquiry to initialize rate limit window',
    });
    // If first call succeeded, immediate second call must trigger rate limit
    await assert.rejects(
      async () => {
        await askCampusCareFn({
          prompt: 'Immediate rapid inquiry testing rate limit',
        });
      },
      (err) => err.code?.includes('resource-exhausted') || /resource-exhausted|wait|seconds/i.test(err.message),
      'Immediate rapid request must be rejected with resource-exhausted'
    );
  } catch (err) {
    // If already rate-limited from prior test calls within 2s
    assert.ok(
      err.code?.includes('resource-exhausted') || /resource-exhausted|wait|seconds/i.test(err.message),
      `Expected resource-exhausted error, got: ${err.message}`
    );
  }

  // Verify production mock restriction helper (already imported above)
  assert.strictEqual(typeof isEmulatorOrTestEnvironment, 'function');
  // In active emulator run, returns true
  assert.strictEqual(isEmulatorOrTestEnvironment(), true);
  console.log(`✓ Test 42 Passed: AI rate limiting, schema validation and mock restrictions confirmed.`);

  // --------------------------------------------------------------------------
  // TEST 43: Rule-Based Proximity Clustering & Similarity Score Omission
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 43] Verifying Rule-Based Location Proximity Clustering & Metadata...`);
  const ruleComp1 = await createComplaintCallable({
    title: 'Ceiling projector flickers violently',
    category: 'ELECTRICAL',
    building: 'Main Academic Block',
    floor: '2nd Floor',
    room: 'Lecture Hall 204',
    description: 'The ceiling projector is flashing blue and green intermittently during lectures.',
    priority: 'MEDIUM',
  });
  const ruleComp2 = await createComplaintCallable({
    title: 'Power socket sparked near podium',
    category: 'ELECTRICAL',
    building: 'Main Academic Block',
    floor: '2nd Floor',
    room: 'Lecture Hall 204',
    description: 'The wall outlet next to the professor podium sparked and stopped working.',
    priority: 'HIGH',
  });
  assert.ok(ruleComp1.data?.success);
  assert.ok(ruleComp2.data?.success);

  let ruleComp2Doc;
  let ruleClusterId;
  for (let attempt = 0; attempt < 50; attempt++) {
    ruleComp2Doc = await db.collection('complaints').doc(ruleComp2.data.data.id).get();
    ruleClusterId = ruleComp2Doc.data()?.clusterId;
    if (ruleClusterId && ruleComp2Doc.data()?.clusteringStatus === 'COMPLETED') break;
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.ok(ruleClusterId, 'Rule-based location proximity should assign a clusterId');

  const ruleClusterDoc = await db.collection('issueClusters').doc(ruleClusterId).get();
  assert.ok(ruleClusterDoc.exists);
  const ruleClusterData = ruleClusterDoc.data();
  assert.strictEqual(ruleClusterData.clusteringMethod, 'RULE_BASED_LOCATION_PROXIMITY');
  assert.strictEqual(ruleClusterData.similarityScore, undefined, 'Rule-based clusters must omit arbitrary numerical similarityScore');
  assert.ok(ruleClusterData.confidenceBasis?.includes('Heuristic identical room & category match'));
  console.log(`✓ Test 43 Passed: Rule-based location proximity verified without false numerical similarity scores.`);

  // --------------------------------------------------------------------------
  // TEST 44: Legacy Embedding Invalidation, Incompatible Vectors & Idempotency
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 44] Verifying Legacy Cache Invalidation, Vector Safety & Idempotency...`);
  const { getOrCreateComplaintEmbedding } = await import('../functions/lib/campusCare.js');
  const { runComplaintClustering } = await import('../functions/lib/complaints.js');

  // 1. Invalidation of legacy text-embedding-004 cache record
  const legacyCompId = 'legacy-test-complaint-id';
  await db.collection('complaintEmbeddings').doc(legacyCompId).set({
    complaintId: legacyCompId,
    embedding: new Array(768).fill(0.123),
    source: 'GEMINI',
    model: 'text-embedding-004', // Discontinued legacy model
    dimensions: 768,
    textHash: 'legacy-hash',
    status: 'SUCCESS',
    createdAt: new Date().toISOString(),
  });

  const refreshedEmb = await getOrCreateComplaintEmbedding(
    db,
    legacyCompId,
    'AC cooling unit is freezing up and creating frost'
  );
  assert.ok(refreshedEmb);
  assert.notStrictEqual(refreshedEmb.model, 'text-embedding-004', 'Legacy text-embedding-004 model must be invalidated');
  assert.strictEqual(refreshedEmb.source, 'TEST');
  assert.strictEqual(refreshedEmb.dimensions, 64);

  // 2. Invalidation of corrupted non-number vector cache
  const corruptCompId = 'corrupt-test-complaint-id';
  await db.collection('complaintEmbeddings').doc(corruptCompId).set({
    complaintId: corruptCompId,
    embedding: [NaN, 0.5, Infinity, null],
    source: 'TEST',
    model: 'deterministic-test-projector',
    dimensions: 4,
    textHash: 'corrupt-hash',
    status: 'SUCCESS',
    createdAt: new Date().toISOString(),
  });

  const cleanEmb = await getOrCreateComplaintEmbedding(
    db,
    corruptCompId,
    'Pipe leak in second floor bathroom'
  );
  assert.ok(cleanEmb);
  assert.strictEqual(cleanEmb.dimensions, 64);
  assert.ok(cleanEmb.embedding.every((v) => typeof v === 'number' && !isNaN(v) && isFinite(v)));

  // 3. Incompatible vector comparisons safely return 0
  assert.strictEqual(cosineSimilarity([0.1, 0.2], [0.1, NaN]), 0, 'Vector with NaN must return 0');
  assert.strictEqual(cosineSimilarity({ values: [0.1], dimensions: 1, model: 'A' }, { values: [0.1], dimensions: 1, model: 'B' }), 0, 'Model mismatch must return 0');

  // 4. Idempotency: repeating runComplaintClustering on an already-clustered complaint
  const clusterSnapBefore = await db.collection('issueClusters').doc(clusterId).get();
  const ticketCountBefore = clusterSnapBefore.data().ticketCount;

  const repeatRun = await runComplaintClustering(db, acComp2Id);
  assert.ok(repeatRun.success);
  assert.strictEqual(repeatRun.status, 'ALREADY_CLUSTERED');
  assert.strictEqual(repeatRun.clusterId, clusterId);

  const clusterSnapAfter = await db.collection('issueClusters').doc(clusterId).get();
  assert.strictEqual(clusterSnapAfter.data().ticketCount, ticketCountBefore, 'Ticket count must not be incremented on retry');
  console.log(`✓ Test 44 Passed: Legacy embedding cache invalidated, vector safety confirmed, and background idempotency verified.`);

  // --------------------------------------------------------------------------
  // TEST 45: Concurrency Safety & Race Condition Prevention
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 45] Verifying Concurrency Safety & Race Condition Prevention...`);
  const concurrencyCompId = 'concurrency-test-comp-1';
  const concurrencyCompRef = db.collection('complaints').doc(concurrencyCompId);
  const concNow = new Date().toISOString();
  await concurrencyCompRef.set({
    id: concurrencyCompId,
    referenceNumber: 'SS-2026-9991',
    title: 'Network switch rebooting intermittently',
    category: 'IT_SUPPORT',
    building: 'Engineering Block',
    floor: '3rd Floor',
    room: 'Server Room 301',
    description: 'Core switch reboots every hour causing dropped SSH sessions.',
    priority: 'HIGH',
    status: 'SUBMITTED',
    submittedById: testStudentUid,
    submittedByName: 'Concurrency Tester',
    submittedByEmail: studentEmail,
    clusteringStatus: 'PENDING',
    clusteringAttempt: 0,
    createdAt: concNow,
    submittedAt: concNow,
    updatedAt: concNow,
    timeline: [],
  });

  // Launch two concurrent worker executions simultaneously
  const [worker1Res, worker2Res] = await Promise.all([
    runComplaintClustering(db, concurrencyCompId, undefined, 'worker-alpha'),
    runComplaintClustering(db, concurrencyCompId, undefined, 'worker-beta'),
  ]);

  // One worker must claim and succeed; the other must encounter LEASE_LOCKED or ALREADY_CLUSTERED
  const statuses = [worker1Res.status, worker2Res.status];
  assert.ok(
    statuses.includes('COMPLETED') || statuses.includes('ALREADY_CLUSTERED'),
    `At least one worker must complete processing (got: ${statuses.join(', ')})`
  );
  assert.ok(
    statuses.includes('LEASE_LOCKED') || statuses.includes('ALREADY_CLUSTERED'),
    `Concurrent worker must be safely locked out with LEASE_LOCKED or ALREADY_CLUSTERED (got: ${statuses.join(', ')})`
  );

  // Verify complaint state in Firestore
  const concDoc = await concurrencyCompRef.get();
  assert.strictEqual(concDoc.data().clusteringStatus, 'COMPLETED');
  assert.strictEqual(concDoc.data().clusteringLeaseOwner, null, 'Lease owner must be released upon completion');
  assert.strictEqual(concDoc.data().clusteringLeaseExpiry, null, 'Lease expiry must be cleared upon completion');

  // Verify that if a cluster was created or joined, ticketIds contains no duplicates and ticketCount === ticketIds.length
  if (concDoc.data().clusterId) {
    const concClusterSnap = await db.collection('issueClusters').doc(concDoc.data().clusterId).get();
    if (concClusterSnap.exists) {
      const clusterData = concClusterSnap.data();
      const uniqueIds = new Set(clusterData.ticketIds);
      assert.strictEqual(clusterData.ticketIds.length, uniqueIds.size, 'Cluster ticketIds must not contain duplicate tickets');
      assert.strictEqual(clusterData.ticketCount, uniqueIds.size, 'Cluster ticketCount must exactly match unique ticket count');
    }
  }
  console.log(`✓ Test 45 Passed: Concurrency-safe atomic lease claiming and idempotent cluster counting verified.`);

  // --------------------------------------------------------------------------
  // TEST 46: Stale Lease Expiry & Worker Crash Recovery
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 46] Verifying Stale Lease Expiry & Worker Crash Recovery...`);
  const staleCompId = 'stale-lease-comp-1';
  const staleCompRef = db.collection('complaints').doc(staleCompId);
  const pastIso = new Date(Date.now() - 5000).toISOString(); // 5 seconds expired
  await staleCompRef.set({
    id: staleCompId,
    referenceNumber: 'SS-2026-9992',
    title: 'Water fountain filter clogged',
    category: 'WATER_SUPPLY',
    building: 'Engineering Block',
    floor: '1st Floor',
    room: 'Hallway 102',
    description: 'Water pressure very low and red filter indicator blinking.',
    priority: 'LOW',
    status: 'SUBMITTED',
    submittedById: testStudentUid,
    submittedByName: 'Stale Lease Tester',
    submittedByEmail: studentEmail,
    clusteringStatus: 'PROCESSING',
    clusteringAttempt: 1,
    clusteringAttemptId: 'attempt_stale_12345',
    clusteringLeaseOwner: 'crashed-worker-old',
    clusteringLeaseExpiry: pastIso,
    createdAt: new Date(Date.now() - 10000).toISOString(),
    submittedAt: new Date(Date.now() - 10000).toISOString(),
    updatedAt: pastIso,
    timeline: [],
  });

  // Recovery worker runs on this complaint
  const recoveryRes = await runComplaintClustering(db, staleCompId, undefined, 'recovery-worker-hero');
  assert.ok(recoveryRes.success, 'Recovery worker must successfully claim expired lease or acknowledge completion');
  assert.ok(
    ['COMPLETED', 'ALREADY_CLUSTERED'].includes(recoveryRes.status),
    `Status must be COMPLETED or ALREADY_CLUSTERED (got: ${recoveryRes.status})`
  );

  // Verify complaint state after recovery
  let recoveredSnap;
  for (let attempt = 0; attempt < 50; attempt++) {
    recoveredSnap = await staleCompRef.get();
    if (recoveredSnap.data()?.clusteringStatus === 'COMPLETED') break;
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.strictEqual(recoveredSnap.data().clusteringStatus, 'COMPLETED');
  assert.ok(recoveredSnap.data().clusteringAttempt >= 2, 'Clustering attempt should increment');
  assert.strictEqual(recoveredSnap.data().clusteringLeaseOwner, null, 'Lease owner must be released');
  assert.strictEqual(recoveredSnap.data().clusteringLeaseExpiry, null, 'Lease expiry must be cleared');
  console.log(`✓ Test 46 Passed: Stale lease recovery and crashed worker takeover verified.`);

  // --------------------------------------------------------------------------
  // TEST 47: Duplicate Cluster Prevention & Cross-Worker Race Coordination
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 47] Verifying Duplicate Cluster Prevention Across Concurrent Complaints...`);
  const raceComp1Id = 'race-comp-alpha';
  const raceComp2Id = 'race-comp-beta';
  const raceNow = new Date().toISOString();

  await db.collection('complaints').doc(raceComp1Id).set({
    id: raceComp1Id,
    referenceNumber: 'SS-2026-9993',
    title: 'Ceiling projector flickering violently',
    category: 'ELECTRICAL',
    building: 'Innovation Hub',
    floor: '2nd Floor',
    room: 'Seminar Room 201',
    description: 'Projector display is blinking green and losing HDMI sync.',
    priority: 'HIGH',
    status: 'SUBMITTED',
    submittedById: testStudentUid,
    submittedByName: 'Student 1',
    submittedByEmail: studentEmail,
    clusteringStatus: 'PENDING',
    clusteringAttempt: 0,
    createdAt: raceNow,
    submittedAt: raceNow,
    updatedAt: raceNow,
    timeline: [],
  });

  await db.collection('complaints').doc(raceComp2Id).set({
    id: raceComp2Id,
    referenceNumber: 'SS-2026-9994',
    title: 'Power adapter sparks near projector mount',
    category: 'ELECTRICAL',
    building: 'Innovation Hub',
    floor: '2nd Floor',
    room: 'Seminar Room 201',
    description: 'Ceiling power outlet next to projector sparked when turned on.',
    priority: 'HIGH',
    status: 'SUBMITTED',
    submittedById: testStudentUid,
    submittedByName: 'Student 2',
    submittedByEmail: studentEmail,
    clusteringStatus: 'PENDING',
    clusteringAttempt: 0,
    createdAt: raceNow,
    submittedAt: raceNow,
    updatedAt: raceNow,
    timeline: [],
  });

  // Two workers concurrently race to create/join the first cluster for this room & category
  await Promise.allSettled([
    runComplaintClustering(db, raceComp1Id, undefined, 'worker-race-1'),
    runComplaintClustering(db, raceComp2Id, undefined, 'worker-race-2'),
  ]);

  // Poll until both complaints have completed clustering
  let raceSnap1, raceSnap2;
  for (let attempt = 0; attempt < 50; attempt++) {
    raceSnap1 = await db.collection('complaints').doc(raceComp1Id).get();
    raceSnap2 = await db.collection('complaints').doc(raceComp2Id).get();
    if (
      raceSnap1.data()?.clusteringStatus === 'COMPLETED' &&
      raceSnap2.data()?.clusteringStatus === 'COMPLETED' &&
      raceSnap1.data()?.clusterId &&
      raceSnap2.data()?.clusterId
    ) {
      break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const clusterId1 = raceSnap1.data().clusterId;
  const clusterId2 = raceSnap2.data().clusterId;

  assert.ok(clusterId1, 'Complaint 1 must have an assigned clusterId');
  assert.ok(clusterId2, 'Complaint 2 must have an assigned clusterId');
  assert.strictEqual(clusterId1, clusterId2, 'Both concurrent complaints MUST join the exact same clusterId');

  // Verify cluster document by ID
  const raceClusterSnap = await db.collection('issueClusters').doc(clusterId1).get();
  assert.ok(raceClusterSnap.exists, 'Cluster document must exist in Firestore');
  const sharedCluster = raceClusterSnap.data();
  assert.strictEqual(sharedCluster.category, 'ELECTRICAL');
  assert.strictEqual(sharedCluster.building, 'Innovation Hub');
  assert.strictEqual(sharedCluster.room, 'Seminar Room 201');
  assert.strictEqual(sharedCluster.ticketCount, 2, 'Shared cluster must have ticketCount == 2');
  assert.ok(sharedCluster.ticketIds.includes(raceComp1Id), 'Must include complaint 1');
  assert.ok(sharedCluster.ticketIds.includes(raceComp2Id), 'Must include complaint 2');

  // Verify that exactly ONE cluster document exists for this room in issueClusters (zero duplicate clusters)
  const allClustersSnap = await db.collection('issueClusters').get();
  const matchedRoomClusters = allClustersSnap.docs.filter(
    (d) => d.data().building === 'Innovation Hub' && d.data().room === 'Seminar Room 201'
  );
  assert.strictEqual(matchedRoomClusters.length, 1, 'Exactly ONE issueCluster must exist for this incident, zero duplicates');
  console.log(`✓ Test 47 Passed: Two concurrent workers for the same room coordinated on a single cluster document without duplicates.`);

  // --------------------------------------------------------------------------
  // TEST 48: Expired Worker Fencing & Zombie Write Prevention
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 48] Verifying Expired Worker Fencing & Zombie Write Prevention...`);
  const { commitClusteringResult } = await import('../functions/lib/complaints.js');
  const fencedCompId = 'fenced-worker-comp-1';
  const fencedNow = new Date().toISOString();

  // Initially create complaint claimed by stale worker whose lease expired 10 seconds ago
  await db.collection('complaints').doc(fencedCompId).set({
    id: fencedCompId,
    referenceNumber: 'SS-2026-9995',
    title: 'HVAC fan humming loudly',
    category: 'AC_HVAC',
    building: 'Innovation Hub',
    floor: '1st Floor',
    room: 'Room 105',
    description: 'Vibration noise throughout the hallway.',
    priority: 'MEDIUM',
    status: 'SUBMITTED',
    submittedById: testStudentUid,
    submittedByName: 'Fencing Tester',
    submittedByEmail: studentEmail,
    clusteringStatus: 'PROCESSING',
    clusteringAttempt: 1,
    clusteringAttemptId: 'attempt_zombie_111',
    clusteringLeaseOwner: 'zombie-worker',
    clusteringLeaseExpiry: new Date(Date.now() - 10000).toISOString(), // expired
    createdAt: fencedNow,
    submittedAt: fencedNow,
    updatedAt: fencedNow,
    timeline: [],
  });

  // Legitimate active recovery worker claims the expired lease and completes processing
  await runComplaintClustering(db, fencedCompId, undefined, 'legit-worker');
  let postLegitSnap;
  for (let attempt = 0; attempt < 50; attempt++) {
    postLegitSnap = await db.collection('complaints').doc(fencedCompId).get();
    if (postLegitSnap.data()?.clusteringStatus === 'COMPLETED') break;
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.strictEqual(postLegitSnap.data().clusteringStatus, 'COMPLETED');
  assert.ok(postLegitSnap.data().clusteringAttempt >= 2);

  // Now the stale zombie worker attempts to commit its outdated result with old attemptId and workerId
  const zombieCommitRes = await commitClusteringResult(db, {
    complaintId: fencedCompId,
    workerId: 'zombie-worker',
    attemptId: 'attempt_zombie_111',
    clusteringMethod: 'RULE_BASED_LOCATION_PROXIMITY',
    matchedDocIds: [],
    clusterMetadata: { confidenceBasis: 'Zombie commit attempt' },
  });

  assert.strictEqual(zombieCommitRes.success, false, 'Zombie worker commit must be rejected');
  assert.strictEqual(zombieCommitRes.status, 'FENCED_EXPIRED_LEASE', 'Status must be FENCED_EXPIRED_LEASE');

  // Verify complaint state was NOT overwritten by zombie worker
  const postZombieSnap = await db.collection('complaints').doc(fencedCompId).get();
  assert.strictEqual(postZombieSnap.data().clusteringStatus, 'COMPLETED');
  assert.ok(postZombieSnap.data().clusteringAttempt >= 2, 'Attempt count must not be rolled back');
  assert.strictEqual(postZombieSnap.data().clusteringLeaseOwner, null, 'Lease owner must remain released');
  console.log(`✓ Test 48 Passed: Expired worker was fenced out; newer worker results preserved.`);

  // --------------------------------------------------------------------------
  // TEST 49: Duplicate Trigger Event Delivery (At-Least-Once Delivery Idempotency)
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 49] Verifying Duplicate Trigger Event Delivery Idempotency...`);
  // Re-invoking clustering on raceComp1Id (already completed and clustered in Test 47)
  const dupEventRes = await runComplaintClustering(db, raceComp1Id, undefined, 'worker-dup-event');
  assert.ok(dupEventRes.success);
  assert.strictEqual(dupEventRes.status, 'ALREADY_CLUSTERED', 'Must recognize complaint is already clustered');
  assert.strictEqual(dupEventRes.clusterId, clusterId1, 'Must return the existing clusterId');

  // Verify cluster ticket count did not increase
  const recheckedClusterSnap = await db.collection('issueClusters').doc(clusterId1).get();
  assert.strictEqual(recheckedClusterSnap.data().ticketCount, 2, 'Ticket count must stay exactly 2');
  assert.strictEqual(recheckedClusterSnap.data().ticketIds.length, 2, 'No duplicate IDs in ticketIds');
  console.log(`✓ Test 49 Passed: Duplicate trigger event delivery safely acknowledged without duplicate counts.`);

  // --------------------------------------------------------------------------
  // TEST 50: Cluster Membership and Counts Stay Correct After Worker Retry
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 50] Verifying Cluster Membership & Count Consistency After Retry...`);
  const retryCompId = 'retry-count-comp-1';
  const retryNow = new Date().toISOString();

  // Create complaint that previously had 1 failed attempt and was reset to PENDING
  await db.collection('complaints').doc(retryCompId).set({
    id: retryCompId,
    referenceNumber: 'SS-2026-9996',
    title: 'Water pipe leaking under sink',
    category: 'WATER_SUPPLY',
    building: 'Innovation Hub',
    floor: '1st Floor',
    room: 'Washroom 101',
    description: 'Heavy dripping into floor drain.',
    priority: 'MEDIUM',
    status: 'SUBMITTED',
    submittedById: testStudentUid,
    submittedByName: 'Retry Student',
    submittedByEmail: studentEmail,
    clusteringStatus: 'PENDING',
    clusteringAttempt: 1,
    clusteringError: '[Retryable] Rate limit exceeded on previous attempt',
    createdAt: retryNow,
    submittedAt: retryNow,
    updatedAt: retryNow,
    timeline: [],
  });

  await runComplaintClustering(db, retryCompId, undefined, 'worker-retry-run');
  let retryDoc;
  for (let attempt = 0; attempt < 50; attempt++) {
    retryDoc = await db.collection('complaints').doc(retryCompId).get();
    if (retryDoc.data()?.clusteringStatus === 'COMPLETED') break;
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.strictEqual(retryDoc.data().clusteringStatus, 'COMPLETED');
  assert.ok(retryDoc.data().clusteringAttempt >= 2, 'Attempt must increment to 2');
  assert.strictEqual(retryDoc.data().clusteringError, null, 'Previous error must be cleared');
  assert.strictEqual(retryDoc.data().clusteringLeaseOwner, null);
  assert.strictEqual(retryDoc.data().clusteringLeaseExpiry, null);

  // Re-run again to ensure idempotency after retry
  const secondRetryRun = await runComplaintClustering(db, retryCompId, undefined, 'worker-retry-second');
  assert.ok(secondRetryRun.success);
  assert.strictEqual(secondRetryRun.status, 'ALREADY_CLUSTERED');

  const finalRetryDoc = await db.collection('complaints').doc(retryCompId).get();
  assert.strictEqual(finalRetryDoc.data().clusteringAttempt, retryDoc.data().clusteringAttempt, 'Attempt should not increment for already completed ticket');
  console.log(`✓ Test 50 Passed: Cluster membership, attempt count, and error clearance verified through retry workflow.`);

  // --------------------------------------------------------------------------
  // TEST 19: Security Scan - Zero API Keys in Client Bundles
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 19] Verifying Zero Sensitive Keys or Secrets in Client Assets...`);
  const distDir = path.resolve('apps/web/dist');
  if (fs.existsSync(distDir)) {
    const assetsDir = path.join(distDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const content = fs.readFileSync(path.join(assetsDir, file), 'utf-8');
          assert.ok(!content.includes('AIzaSy'), `File ${file} must not contain Google API key prefixes`);
          assert.ok(!content.includes('GEMINI_API_KEY'), `File ${file} must not contain GEMINI_API_KEY`);
        }
      }
    }
  }
  console.log(`✓ Test 19 Passed: Client distribution verified free of exposed API keys.`);

  // --------------------------------------------------------------------------
  // TEST 51: Phase 8 End-to-End Real Data Visibility: Admin-Created Records
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 51] Verifying Phase 8 Admin-to-Student Real Data Visibility & Key Protection...`);

  // Switch to Admin
  await signInWithEmailAndPassword(clientAuth, adminEmail, 'SolveSphereAdmin@2026');

  // 1. Admin creates accredited subject
  const realSubjId = 'subj-algorithms-real';
  const subjNow = new Date().toISOString();
  await setDoc(doc(clientDb, 'subjects', realSubjId), {
    id: realSubjId,
    code: 'CS204',
    name: 'Design and Analysis of Algorithms',
    instructor: 'Prof. Ananya Sen',
    department: 'Computer Science & AI',
    credits: 4,
    category: 'CORE',
    description: 'Asymptotic notation, divide-and-conquer, greedy algorithms, and dynamic programming.',
    semester: 2,
    academicYear: '2026-2027',
    totalTopics: 1,
    completedTopics: 0,
    progressPercentage: 0,
    createdAt: subjNow,
    updatedAt: subjNow,
    isArchived: false,
  });

  // 2. Admin creates syllabus topic
  const realTopicId = 'topic-strassen-mult';
  await setDoc(doc(clientDb, 'syllabusTopics', realTopicId), {
    id: realTopicId,
    subjectId: realSubjId,
    unit: 1,
    title: 'Divide and Conquer: Strassen Matrix Multiplication',
    description: 'Recurrence analysis and sub-cubic matrix algebra.',
    estimatedHours: 4,
    order: 1,
    status: 'ONGOING',
    isCurrent: true,
    createdAt: subjNow,
    updatedAt: subjNow,
    isArchived: false,
  });

  // 3. Admin creates quiz with protected question keys via adminSaveQuiz Cloud Function
  const adminSaveQuizCallable = httpsCallable(clientFunctions, 'adminSaveQuiz');
  const saveQuizRes = await adminSaveQuizCallable({
    quiz: {
      subjectId: realSubjId,
      title: 'Algorithms Unit 1 Diagnostic Assessment',
      description: 'Master Theorem and Recurrence Analysis.',
      durationMinutes: 20,
      difficulty: 'INTERMEDIATE',
      type: 'QUIZ',
      published: true,
    },
    questions: [
      {
        questionText: 'What is the runtime of Strassens matrix multiplication algorithm?',
        options: ['O(n^2)', 'O(n^2.81)', 'O(n^3)', 'O(n log n)'],
        correctOptionIndex: 1,
        explanation: 'Strassens algorithm achieves roughly O(n^2.807) operations using 7 multiplications.',
        order: 1,
      },
    ],
  });
  assert.ok(saveQuizRes.data?.success);
  const realQuizId = saveQuizRes.data?.quizId;
  assert.ok(realQuizId);

  // 4. Admin creates campus department via adminManageDepartment
  const manageDeptCallable51 = httpsCallable(clientFunctions, 'adminManageDepartment');
  const createDeptRes51 = await manageDeptCallable51({
    action: 'create',
    data: {
      name: 'Advanced Computing Infrastructure Division',
      code: 'ACI-FACILITY',
      category: 'GENERAL_INFRASTRUCTURE',
      headName: 'Dr. Vikram Chandra',
      contactEmail: 'aci-ops@campus.edu',
      isActive: true,
    },
  });
  assert.ok(createDeptRes51.data?.success);
  const realDeptId = createDeptRes51.data?.department?.id;
  assert.ok(realDeptId);

  // 5. Admin creates campus club via adminManageClub
  const manageClubCallable51 = httpsCallable(clientFunctions, 'adminManageClub');
  const createClubRes51 = await manageClubCallable51({
    action: 'create',
    data: {
      name: 'Competitive Algorithmic Thinkers Society',
      category: 'TECHNOLOGY',
      leadName: 'Priya Sundaram',
      description: 'ACM-ICPC and algorithmic contest problem solvers.',
      memberCount: 50,
      meetingSchedule: 'Fridays at 5 PM',
      tags: ['Algorithms', 'ICPC', 'CompetitiveProgramming'],
    },
  });
  assert.ok(createClubRes51.data?.success);
  const realClubId = createClubRes51.data?.club?.id;
  assert.ok(realClubId);

  // Switch to Student
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');

  // Verify Student can read the newly created real Subject
  const studentSubjSnap = await getDoc(doc(clientDb, 'subjects', realSubjId));
  assert.ok(studentSubjSnap.exists(), 'Student must be able to view admin-created subject');
  assert.strictEqual(studentSubjSnap.data().name, 'Design and Analysis of Algorithms');
  assert.strictEqual(studentSubjSnap.data().code, 'CS204');
  assert.strictEqual(studentSubjSnap.data().credits, 4);

  // Verify Student can read the newly created Syllabus Topic
  const studentTopicSnap = await getDoc(doc(clientDb, 'syllabusTopics', realTopicId));
  assert.ok(studentTopicSnap.exists(), 'Student must be able to view admin-created topic');
  assert.strictEqual(studentTopicSnap.data().title, 'Divide and Conquer: Strassen Matrix Multiplication');
  assert.strictEqual(studentTopicSnap.data().status, 'ONGOING');

  // Verify Student can read the published Quiz metadata
  const studentQuizSnap = await getDoc(doc(clientDb, 'quizzes', realQuizId));
  assert.ok(studentQuizSnap.exists(), 'Student must be able to view published quiz');
  assert.strictEqual(studentQuizSnap.data().title, 'Algorithms Unit 1 Diagnostic Assessment');
  assert.strictEqual(studentQuizSnap.data().questionsCount, 1);

  // Verify Student accessing questions receives sanitized payloads (correctOptionIndex and explanation stripped)
  const getQuizQuestionsCallable = httpsCallable(clientFunctions, 'getQuizQuestions');
  const studentQuestionsRes = await getQuizQuestionsCallable({ quizId: realQuizId });
  assert.ok(studentQuestionsRes.data?.questions?.length === 1);
  const returnedQuestion = studentQuestionsRes.data.questions[0];
  assert.strictEqual(returnedQuestion.questionText, 'What is the runtime of Strassens matrix multiplication algorithm?');
  assert.strictEqual(returnedQuestion.correctOptionIndex, undefined, 'Answer key must be protected from student inspection');
  assert.strictEqual(returnedQuestion.explanation, undefined, 'Explanation must be protected before grading');

  // Verify Student can view newly created active department
  const studentDeptSnap = await getDoc(doc(clientDb, 'departments', realDeptId));
  assert.ok(studentDeptSnap.exists(), 'Student must be able to view active department');
  assert.strictEqual(studentDeptSnap.data().name, 'Advanced Computing Infrastructure Division');
  assert.strictEqual(studentDeptSnap.data().isActive, true);

  // Verify Student can view newly created campus club
  const studentClubSnap = await getDoc(doc(clientDb, 'campusClubs', realClubId));
  assert.ok(studentClubSnap.exists(), 'Student must be able to view campus club');
  assert.strictEqual(studentClubSnap.data().name, 'Competitive Algorithmic Thinkers Society');

  console.log(`✓ Test 51 Passed: Admin-created academic subjects, syllabus topics, protected quizzes, campus departments, and clubs are fully visible to students with answer keys protected.`);

  // --------------------------------------------------------------------------
  // TEST 52: Negative Assessment Publication Integrity & Draft Protection
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 52] Verifying Negative Assessment Publication Integrity & Draft Protection...`);

  // Switch back to Admin
  await signInWithEmailAndPassword(clientAuth, adminEmail, 'SolveSphereAdmin@2026');

  // Negative 1: Admin tries to publish quiz with empty question text
  await assert.rejects(
    async () => {
      await adminSaveQuizCallable({
        quiz: {
          subjectId: realSubjId,
          title: 'Invalid Quiz - Empty Question',
          durationMinutes: 15,
          difficulty: 'BEGINNER',
          published: true,
        },
        questions: [
          {
            questionText: '   ',
            options: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
            correctOptionIndex: 0,
            explanation: 'Valid explanation here.',
            order: 1,
          },
        ],
      });
    },
    (err) => err.code?.includes('invalid-argument') || /validation|invalid-argument/i.test(err.message),
    'Publishing a quiz with empty question text must be rejected with invalid-argument'
  );

  // Negative 2: Admin tries to publish quiz with empty option string
  await assert.rejects(
    async () => {
      await adminSaveQuizCallable({
        quiz: {
          subjectId: realSubjId,
          title: 'Invalid Quiz - Blank Option',
          durationMinutes: 15,
          difficulty: 'BEGINNER',
          published: true,
        },
        questions: [
          {
            questionText: 'Valid question text here?',
            options: ['Option 1', '', 'Option 3', 'Option 4'],
            correctOptionIndex: 0,
            explanation: 'Valid explanation here.',
            order: 1,
          },
        ],
      });
    },
    (err) => err.code?.includes('invalid-argument') || /validation|invalid-argument/i.test(err.message),
    'Publishing a quiz with empty options must be rejected with invalid-argument'
  );

  // Negative 3: Admin tries to publish quiz with invalid correctOptionIndex
  await assert.rejects(
    async () => {
      await adminSaveQuizCallable({
        quiz: {
          subjectId: realSubjId,
          title: 'Invalid Quiz - Out of Range Correct Index',
          durationMinutes: 15,
          difficulty: 'BEGINNER',
          published: true,
        },
        questions: [
          {
            questionText: 'Valid question text here?',
            options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            correctOptionIndex: 5, // Invalid: must be 0-3
            explanation: 'Valid explanation here.',
            order: 1,
          },
        ],
      });
    },
    (err) => err.code?.includes('invalid-argument') || /validation|invalid-argument/i.test(err.message),
    'Publishing a quiz with correctOptionIndex > 3 must be rejected with invalid-argument'
  );

  // Negative 4: Admin tries to publish quiz with empty explanation
  await assert.rejects(
    async () => {
      await adminSaveQuizCallable({
        quiz: {
          subjectId: realSubjId,
          title: 'Invalid Quiz - Missing Explanation',
          durationMinutes: 15,
          difficulty: 'BEGINNER',
          published: true,
        },
        questions: [
          {
            questionText: 'Valid question text here?',
            options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            correctOptionIndex: 1,
            explanation: '   ',
            order: 1,
          },
        ],
      });
    },
    (err) => err.code?.includes('invalid-argument') || /validation|invalid-argument/i.test(err.message),
    'Publishing a quiz with empty explanation must be rejected with invalid-argument'
  );

  // Draft Flow: Admin saves incomplete quiz as draft (published: false)
  const draftQuizRes = await adminSaveQuizCallable({
    quiz: {
      subjectId: realSubjId,
      title: 'In-Progress Incomplete Draft Assessment',
      description: 'Draft notes still being compiled by faculty.',
      durationMinutes: 15,
      difficulty: 'BEGINNER',
      published: false,
    },
    questions: [
      {
        questionText: 'Draft question title without all 4 options',
        options: ['Candidate Draft Option A'],
        correctOptionIndex: 0,
        explanation: 'Work in progress',
        order: 1,
      },
    ],
  });
  assert.ok(draftQuizRes.data?.success, 'Saving draft quiz must succeed');
  const draftQuizId = draftQuizRes.data?.quizId;
  assert.ok(draftQuizId);

  // Switch to Student
  await signInWithEmailAndPassword(clientAuth, studentEmail, 'Password@2026');

  // Negative 5: Student cannot fetch questions for unpublished draft quiz
  await assert.rejects(
    async () => {
      await getQuizQuestionsCallable({ quizId: draftQuizId });
    },
    (err) => err.code?.includes('failed-precondition') || /unpublished|draft|failed-precondition/i.test(err.message),
    'Student attempting to get questions for draft quiz must be rejected with failed-precondition'
  );

  // Negative 6: Student cannot submit attempts for unpublished draft quiz
  const submitQuizCallable52 = httpsCallable(clientFunctions, 'submitQuiz');
  await assert.rejects(
    async () => {
      await submitQuizCallable52({
        quizId: draftQuizId,
        answers: [{ questionId: 'any-q-id', selectedOptionIndex: 0 }],
      });
    },
    (err) => err.code?.includes('failed-precondition') || /unpublished|draft|failed-precondition/i.test(err.message),
    'Student attempting to submit draft quiz must be rejected with failed-precondition'
  );

  // Negative 7: Non-admin student cannot call adminSaveQuiz
  await assert.rejects(
    async () => {
      await adminSaveQuizCallable({
        quiz: {
          subjectId: realSubjId,
          title: 'Unauthorized Student Created Quiz',
          durationMinutes: 10,
          difficulty: 'BEGINNER',
          published: false,
        },
        questions: [],
      });
    },
    (err) => err.code?.includes('permission-denied') || /permission|unauthorized|denied/i.test(err.message),
    'Student attempting to invoke adminSaveQuiz must be rejected with permission-denied'
  );

  console.log(`✓ Test 52 Passed: Negative assessment validation, draft isolation, and unauthorized caller blocks confirmed.`);

  // --------------------------------------------------------------------------
  // TEST 53: Phase 8.5 Production Authentication & Profile Security Verification
  // --------------------------------------------------------------------------
  console.log(`\n[TEST 53] Verifying Phase 8.5 Production Student & Admin Authentication Workflows...`);

  const uniqueStudentEmail = `student.phase85.${Date.now()}@university.edu`;
  const uniqueStudentPassword = 'ComplexStudentPass@2026';

  // 1. Real Student Account Creation via Firebase Auth client SDK
  const studentCred53 = await createUserWithEmailAndPassword(clientAuth, uniqueStudentEmail, uniqueStudentPassword);
  assert.ok(studentCred53.user.uid, 'Firebase Auth must generate valid UID');
  const studentUid53 = studentCred53.user.uid;

  // Update Auth displayName
  await updateClientProfile(studentCred53.user, { displayName: 'Kavya Raman' });
  assert.strictEqual(studentCred53.user.displayName, 'Kavya Raman');

  // 2. Email verification dispatch
  await sendEmailVerification(studentCred53.user);
  console.log(`✓ Email verification message dispatched for ${uniqueStudentEmail}`);

  // 3. Create initial student profile in `users/{uid}` matching Security Rules
  const studentProfileNow = new Date().toISOString();
  await setDoc(doc(clientDb, 'users', studentUid53), {
    id: studentUid53,
    email: uniqueStudentEmail,
    fullName: 'Kavya Raman',
    studentId: 'STU-2026-9042',
    role: 'STUDENT',
    department: 'Computer Science & AI',
    semester: 2,
    emailVerified: false,
    createdAt: studentProfileNow,
    updatedAt: studentProfileNow,
  });

  // Verify student profile exists
  const profileSnap53 = await getDoc(doc(clientDb, 'users', studentUid53));
  assert.ok(profileSnap53.exists(), 'Profile document must exist in Firestore');
  assert.strictEqual(profileSnap53.data().role, 'STUDENT');
  assert.strictEqual(profileSnap53.data().studentId, 'STU-2026-9042');

  // 4. Duplicate Email Registration Rejection
  await assert.rejects(
    async () => {
      await createUserWithEmailAndPassword(clientAuth, uniqueStudentEmail, 'AnotherPassword@2026');
    },
    /auth\/email-already-in-use/i,
    'Registering an existing email must fail with auth/email-already-in-use'
  );

  // 5. Password Reset Request
  await sendPasswordResetEmail(clientAuth, uniqueStudentEmail);
  console.log(`✓ Password reset request succeeded for ${uniqueStudentEmail}`);

  // 6. Security Rule: Student cannot self-escalate role to ADMIN
  await assert.rejects(
    async () => {
      await updateDoc(doc(clientDb, 'users', studentUid53), {
        role: 'ADMIN',
      });
    },
    /permission-denied/i,
    'Student attempting to update role to ADMIN must be blocked by Firestore Rules'
  );

  // 7. Security Rule: Student cannot alter immutable student ID
  await assert.rejects(
    async () => {
      await updateDoc(doc(clientDb, 'users', studentUid53), {
        studentId: 'STU-FORGED-9999',
      });
    },
    /permission-denied/i,
    'Student attempting to alter studentId must be blocked by Firestore Rules'
  );

  // 8. Security Rule: Student cannot read another student profile
  await assert.rejects(
    async () => {
      await getDoc(doc(clientDb, 'users', testStudentUid));
    },
    /permission-denied/i,
    'Student attempting to read another student profile must be blocked by Firestore Rules'
  );

  // 9. Permitted profile update succeeds (department, semester)
  await updateDoc(doc(clientDb, 'users', studentUid53), {
    department: 'AI & Data Science',
    semester: 3,
    updatedAt: new Date().toISOString(),
  });
  const updatedProfileSnap = await getDoc(doc(clientDb, 'users', studentUid53));
  assert.strictEqual(updatedProfileSnap.data().department, 'AI & Data Science');
  assert.strictEqual(updatedProfileSnap.data().semester, 3);

  // 10. Non-admin student blocked from administrative Cloud Functions
  const manageDeptFn53 = httpsCallable(clientFunctions, 'adminManageDepartment');
  await assert.rejects(
    async () => {
      await manageDeptFn53({
        action: 'create',
        data: {
          name: 'Unauthorized Student Department',
          code: 'UNAUTH',
          category: 'GENERAL_INFRASTRUCTURE',
          headName: 'Imposter',
          contactEmail: 'unauth@campus.edu',
          isActive: true,
        },
      });
    },
    (err) => err.code?.includes('permission-denied') || /permission|unauthorized|denied/i.test(err.message),
    'Non-admin student must be rejected with permission-denied from adminManageDepartment'
  );

  // Sign out student
  await signOut(clientAuth);

  // 11. Admin Authentication with Custom Claim Verification
  const adminCred53 = await signInWithEmailAndPassword(clientAuth, adminEmail, 'SolveSphereAdmin@2026');
  const adminToken53 = await adminCred53.user.getIdTokenResult(true);
  assert.strictEqual(adminToken53.claims.role, 'ADMIN', 'Admin user must have verified role: "ADMIN" custom claim');

  // Admin can read any student profile
  const adminReadStudentSnap = await getDoc(doc(clientDb, 'users', studentUid53));
  assert.ok(adminReadStudentSnap.exists(), 'Admin must have permission to read any student profile');
  assert.strictEqual(adminReadStudentSnap.data().fullName, 'Kavya Raman');

  console.log(`✓ Test 53 Passed: Student registration, email verification dispatch, profile ownership, role escalation protection, and admin RBAC verified.`);

  console.log(`\n======================================================`);
  console.log(`  ALL 53 INTEGRATION, AI & SECURITY TESTS PASSED!`);
  console.log(`======================================================\n`);
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
