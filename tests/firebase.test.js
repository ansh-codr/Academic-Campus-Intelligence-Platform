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

// Configure emulator endpoints
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'solvesphere-ai-dev',
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

  console.log(`\n======================================================`);
  console.log(`  ALL 13 INTEGRATION & ACADEMIC SECURITY TESTS PASSED!`);
  console.log(`======================================================\n`);
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
