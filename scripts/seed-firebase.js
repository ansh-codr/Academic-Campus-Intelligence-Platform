/**
 * SolveSphere AI — Deterministic Firebase Development Seed Script
 * 
 * Seeds:
 * - 6 First-Year Subjects
 * - Syllabus Topics (Completed, Ongoing, Upcoming)
 * - Faculty-Approved Study Resources
 * - Campus Departments
 * - Campus Student Clubs
 * - System counter for complaint sequencing
 * 
 * Usage:
 *   node scripts/seed-firebase.js
 */

import admin from 'firebase-admin';
import { FIXTURE_SUBJECTS, FIXTURE_TOPICS, FIXTURE_RESOURCES } from '../apps/web/src/fixtures/academicFixtures.ts';
import { FIXTURE_CLUBS, FIXTURE_TICKETS, FIXTURE_CLUSTERS } from '../apps/web/src/fixtures/campusFixtures.ts';

// Target emulators if live credentials not explicitly provided
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
}

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'solvesphere-ai-dev',
  });
}

const db = admin.firestore();

async function seed() {
  console.log(`\n======================================================`);
  console.log(`  SolveSphere AI — Seeding Firestore Database`);
  console.log(`  Firestore Host: ${process.env.FIRESTORE_EMULATOR_HOST || 'Cloud'}`);
  console.log(`======================================================\n`);

  const batch = db.batch();

  // 1. Seed Subjects
  console.log(`Seeding ${FIXTURE_SUBJECTS.length} subjects...`);
  for (const subject of FIXTURE_SUBJECTS) {
    const docRef = db.collection('subjects').doc(subject.id);
    batch.set(docRef, { ...subject, isSampleData: true });
  }

  // 2. Seed Topics
  console.log(`Seeding ${FIXTURE_TOPICS.length} syllabus topics...`);
  for (const topic of FIXTURE_TOPICS) {
    const docRef = db.collection('syllabusTopics').doc(topic.id);
    batch.set(docRef, { ...topic, isSampleData: true });
  }

  // 3. Seed Resources
  console.log(`Seeding ${FIXTURE_RESOURCES.length} study resources...`);
  for (const res of FIXTURE_RESOURCES) {
    const docRef = db.collection('resources').doc(res.id);
    batch.set(docRef, { ...res, isSampleData: true });
  }

  // 4. Seed Campus Clubs
  console.log(`Seeding ${FIXTURE_CLUBS.length} campus clubs...`);
  for (const club of FIXTURE_CLUBS) {
    const docRef = db.collection('campusClubs').doc(club.id);
    batch.set(docRef, { ...club, isSampleData: true });
  }

  // 5. Seed Departments
  const departments = [
    { id: 'dept-hvac', name: 'HVAC & Climate Control', code: 'HVAC', active: true },
    { id: 'dept-it', name: 'IT & Campus Network Operations', code: 'IT_NET', active: true },
    { id: 'dept-elec', name: 'Electrical Maintenance', code: 'ELEC', active: true },
    { id: 'dept-plumb', name: 'Public Health & Plumbing', code: 'PLUMB', active: true },
    { id: 'dept-estate', name: 'Campus Estate & General Infrastructure', code: 'ESTATE', active: true },
    { id: 'dept-hostel', name: 'Hostel Administration Office', code: 'HOSTEL', active: true },
  ];
  console.log(`Seeding ${departments.length} campus departments...`);
  for (const dept of departments) {
    const docRef = db.collection('departments').doc(dept.id);
    batch.set(docRef, dept);
  }

  // 6. Seed System Sequence Counter
  console.log(`Initializing system complaint sequence counter...`);
  const counterRef = db.collection('systemCounters').doc('complaints');
  batch.set(counterRef, { currentSequence: 840 }, { merge: true });

  // 6b. Seed Practice Quizzes and MCQs
  console.log(`Seeding quizzes and questions...`);
  const quizzes = [
    {
      id: 'quiz-cs101',
      subjectId: 'subj-cs101',
      title: 'Foundation in AI: Neural Networks & Search Algorithms',
      description: 'Master heuristics, A* admissibility, activation functions, and backpropagation optimization.',
      type: 'QUIZ',
      durationMinutes: 15,
      difficulty: 'INTERMEDIATE',
      published: true,
      questionsCount: 3,
      createdAt: '2026-11-01T10:00:00.000Z',
      questions: [
        {
          id: 'q-cs-1',
          questionText: 'In heuristic state space search, what condition guarantees that the A* algorithm will return an optimal path?',
          options: [
            'The heuristic h(n) must be admissible (never overestimate the true cost to the goal)',
            'The heuristic h(n) must be strictly greater than the path cost g(n)',
            'The branching factor must be strictly less than 2',
            'The search space must contain no cycles or back-edges',
          ],
          correctOptionIndex: 0,
          explanation: 'Admissibility (h(n) <= h*(n)) guarantees A* tree search optimality. For graph search, consistency (monotonicity) is also sufficient.',
        },
        {
          id: 'q-cs-2',
          questionText: 'Which non-linear activation function mitigates the vanishing gradient problem in deep neural network hidden layers by outputting zero for negative inputs and an identity slope for positive inputs?',
          options: ['Sigmoid', 'Hyperbolic Tangent (Tanh)', 'Rectified Linear Unit (ReLU)', 'Softmax'],
          correctOptionIndex: 2,
          explanation: 'ReLU (f(x) = max(0, x)) has a constant gradient of 1 for x > 0, preventing vanishing gradients in deep feedforward architectures.',
        },
        {
          id: 'q-cs-3',
          questionText: 'What is the primary role of the learning rate hyperparameter during Stochastic Gradient Descent (SGD) optimization?',
          options: [
            'Determining the dimension of the input feature vector',
            'Scaling the step size taken along the negative gradient direction',
            'Normalizing batch mini-group distributions',
            'Computing the cross-entropy loss between predicted and ground truth labels',
          ],
          correctOptionIndex: 1,
          explanation: 'The learning rate scales the magnitude of parameter updates along the negative gradient vector during backpropagation.',
        },
      ],
    },
    {
      id: 'quiz-dt102',
      subjectId: 'subj-dt102',
      title: 'Design Thinking: Empathy Research & Prototyping',
      description: 'Human-centered design frameworks, extreme user empathy, and iterative wireframing.',
      type: 'QUIZ',
      durationMinutes: 10,
      difficulty: 'BEGINNER',
      published: true,
      questionsCount: 2,
      createdAt: '2026-11-02T10:00:00.000Z',
      questions: [
        {
          id: 'q-dt-1',
          questionText: 'In the Stanford d.school Design Thinking methodology, which phase focuses on building low-resolution representations of concepts to test assumptions rapidly?',
          options: ['Empathize', 'Define', 'Ideate', 'Prototype'],
          correctOptionIndex: 3,
          explanation: 'Prototyping involves creating tangible artifacts to explore, test, and validate hypotheses with users.',
        },
        {
          id: 'q-dt-2',
          questionText: 'What is the primary objective of formulating "How-Might-We" (HMW) statements during problem framing?',
          options: [
            'To immediately decide the technical software architecture',
            'To reframe problem insights into open-ended opportunities for generative ideation',
            'To establish contractual service level agreements with stakeholders',
            'To eliminate all extreme users from demographic field studies',
          ],
          correctOptionIndex: 1,
          explanation: 'HMW statements open up problem spaces for creative, user-centric brainstorming rather than presupposing narrow solutions.',
        },
      ],
    },
    {
      id: 'quiz-de103',
      subjectId: 'subj-de103',
      title: 'Digital Electronics: Flip-Flops & Counter Circuits',
      description: 'Combinational logic minimization, sequential flip-flops, excitation tables, and timing diagrams.',
      type: 'QUIZ',
      durationMinutes: 15,
      difficulty: 'INTERMEDIATE',
      published: true,
      questionsCount: 2,
      createdAt: '2026-11-03T10:00:00.000Z',
      questions: [
        {
          id: 'q-de-1',
          questionText: 'In a synchronous counter designed using JK flip-flops, why is the toggle condition (J=1, K=1) used for state transitions?',
          options: [
            'Because it forces the output Q to 0 asynchronously',
            'Because it inverts the stored output bit on each active clock edge',
            'Because it resets the clock pulse propagation delay to zero',
            'Because it eliminates static-1 timing hazards in combinational logic',
          ],
          correctOptionIndex: 1,
          explanation: 'When J=1 and K=1, the JK flip-flop toggles its output Q on each active clock edge (Q_next = Q_bar), enabling binary count sequences.',
        },
        {
          id: 'q-de-2',
          questionText: 'What is the simplified Boolean expression for F(A,B) = A\'B + AB using Boolean algebra or Karnaugh mapping?',
          options: ['A', 'B', 'A + B', 'A\'B\''],
          correctOptionIndex: 1,
          explanation: 'F(A,B) = (A\' + A)B = 1 * B = B.',
        },
      ],
    },
    {
      id: 'quiz-del104',
      subjectId: 'subj-del104',
      title: 'Digital Electronics Lab: Breadboard & Logic IC Diagnostics',
      description: 'Hands-on lab hardware debugging, TTL 7400 IC pinouts, and logic probe state verification.',
      type: 'QUIZ',
      durationMinutes: 10,
      difficulty: 'INTERMEDIATE',
      published: true,
      questionsCount: 2,
      createdAt: '2026-11-04T10:00:00.000Z',
      questions: [
        {
          id: 'q-del-1',
          questionText: 'When probing a digital circuit on a breadboard, what state is indicated if a standard TTL logic probe shows both HIGH and LOW LEDs extinguished on an input pin?',
          options: [
            'Logic HIGH (5.0V)',
            'Logic LOW (0.0V)',
            'Floating / High-Impedance (Hi-Z) or disconnected input',
            'Ground short-circuit',
          ],
          correctOptionIndex: 2,
          explanation: 'In TTL circuits, an open or floating node hovers in the undefined threshold band (~1.5V) and registers as high-impedance without pulling high or low.',
        },
        {
          id: 'q-del-2',
          questionText: 'Which TTL 7400-series integrated circuit contains four dual-input positive NAND gates?',
          options: ['7400', '7402', '7404', '7408'],
          correctOptionIndex: 0,
          explanation: 'IC 7400 is the quintessential Quad 2-Input NAND gate IC.',
        },
      ],
    },
    {
      id: 'quiz-ma105',
      subjectId: 'subj-ma105',
      title: 'Mathematics: Matrices, Eigenvalues & Diagonalization',
      description: 'Vector spaces, characteristic polynomials, Cayley-Hamilton theorem, and diagonal forms.',
      type: 'QUIZ',
      durationMinutes: 15,
      difficulty: 'ADVANCED',
      published: true,
      questionsCount: 2,
      createdAt: '2026-11-05T10:00:00.000Z',
      questions: [
        {
          id: 'q-ma-1',
          questionText: 'If A is an n x n square matrix with eigenvalues λ, what are the eigenvalues of matrix A^2?',
          options: ['λ', 'λ^2', '2λ', '√λ'],
          correctOptionIndex: 1,
          explanation: 'If Av = λv, then A^2 v = A(Av) = A(λv) = λ(Av) = λ^2 v. Hence the eigenvalues are λ^2.',
        },
        {
          id: 'q-ma-2',
          questionText: 'Under what condition is an n x n matrix A guaranteed to be diagonalizable over the real numbers?',
          options: [
            'It has determinant equal to 0',
            'It possesses n linearly independent eigenvectors',
            'Its trace is strictly greater than n',
            'All diagonal entries are non-zero',
          ],
          correctOptionIndex: 1,
          explanation: 'A matrix is diagonalizable if and only if there exists an eigenbasis consisting of n linearly independent eigenvectors.',
        },
      ],
    },
    {
      id: 'quiz-bc106',
      subjectId: 'subj-bc106',
      title: 'Business Communication: Presentation Architecture & Executive Briefs',
      description: 'BLUF principle, project defense Q&A tactics, and technical document drafting.',
      type: 'QUIZ',
      durationMinutes: 10,
      difficulty: 'BEGINNER',
      published: true,
      questionsCount: 2,
      createdAt: '2026-11-06T10:00:00.000Z',
      questions: [
        {
          id: 'q-bc-1',
          questionText: 'In executive technical briefings, what is the "BLUF" (Bottom Line Up Front) principle designed to accomplish?',
          options: [
            'Placing detailed appendices before introductory remarks',
            'Communicating the core conclusion and recommendation immediately to save stakeholder decision time',
            'Eliminating all data charts and graphs from presentations',
            'Extending oral presentations beyond the allotted schedule',
          ],
          correctOptionIndex: 1,
          explanation: 'BLUF presents recommendations, key takeaways, and decisions at the outset for maximum executive clarity.',
        },
        {
          id: 'q-bc-2',
          questionText: 'During a technical engineering defense presentation, how should an engineer effectively address a tough question when the answer is not immediately known?',
          options: [
            'Guess an answer with false confidence',
            'Acknowledge the question, explain current knowledge bounds, and commit to following up with verified data',
            'Ignore the questioner and advance to the next slide',
            'Directly blame a teammate for missing the calculation',
          ],
          correctOptionIndex: 1,
          explanation: 'Ethical professional engineering communication requires transparent acknowledgment of knowns vs unknowns and proactive follow-up.',
        },
      ],
    },
  ];

  for (const q of quizzes) {
    const { questions: qQuestions, ...qMeta } = q;
    const qDocRef = db.collection('quizzes').doc(q.id);
    batch.set(qDocRef, { ...qMeta, isSampleData: true });
  }

  await batch.commit();
  console.log(`\n✓ Base batch committed successfully!`);

  // 6c. Seed Questions subcollection
  console.log(`Writing question subcollections for quizzes...`);
  for (const q of quizzes) {
    for (const question of q.questions) {
      await db
        .collection('quizzes')
        .doc(q.id)
        .collection('questions')
        .doc(question.id)
        .set({
          ...question,
          quizId: q.id,
          subjectId: q.subjectId,
        });
    }
  }
  console.log(`✓ Quiz questions written to protected subcollections.`);

  // 7. Seed Sample Complaints with Subcollection Timelines
  console.log(`Seeding sample complaints with timeline event subcollections...`);
  for (const ticket of FIXTURE_TICKETS) {
    const complaintRef = db.collection('complaints').doc(ticket.id);
    const { timeline, ...complaintData } = ticket;
    await complaintRef.set({ ...complaintData, isSampleData: true });

    if (timeline && timeline.length > 0) {
      for (const ev of timeline) {
        await complaintRef.collection('timeline').doc(ev.id).set(ev);
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`  Firestore Seed Complete!`);
  console.log(`======================================================\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Fatal error seeding Firestore:', err);
  process.exit(1);
});
