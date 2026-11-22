/**
 * SolveSphere AI — Deterministic Firebase Development Seed Script
 * 
 * Safety & Integrity Standards:
 * - Restricted to Firebase Emulator Suite only by default.
 * - Refuses to execute against live Firestore even if GOOGLE_APPLICATION_CREDENTIALS is set.
 * - Prevents accidental overwriting of production subjects, counters, or user data.
 * 
 * Seeds:
 * - 6 First-Year Academic Subjects
 * - Syllabus Topics (Completed, Ongoing, Upcoming)
 * - Faculty-Approved Study Resources
 * - Campus Departments
 * - Campus Student Clubs
 * - System counter for complaint sequencing (emulator only)
 * - Sample Quizzes and Question Bank
 * - Sample Complaints and Event Timelines
 * 
 * Usage:
 *   # Standard emulator seed:
 *   npm run seed
 *   # or:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/seed-firebase.js
 */

import admin from 'firebase-admin';
import { FIXTURE_SUBJECTS, FIXTURE_TOPICS, FIXTURE_RESOURCES } from '../apps/web/src/fixtures/academicFixtures.ts';
import { FIXTURE_CLUBS, FIXTURE_TICKETS, FIXTURE_CLUSTERS } from '../apps/web/src/fixtures/campusFixtures.ts';

/**
 * Validates that database seeding is executing against a safe, authorized target.
 * Throws an informative error if an unauthorized live Firestore target is detected.
 * Exported for deterministic unit testing.
 */
export function validateSeedTarget(env = process.env) {
  const isEmulator = Boolean(env.FIRESTORE_EMULATOR_HOST);

  if (!isEmulator) {
    const isExplicitlyAuthorized =
      env.ALLOW_LIVE_DATABASE_MIGRATION === 'true' &&
      Boolean(env.CONFIRM_MIGRATION_PROJECT_ID) &&
      !env.CONFIRM_MIGRATION_PROJECT_ID.includes('<');

    if (!isExplicitlyAuthorized) {
      throw new Error(
        'REFUSED: seed-firebase.js is strictly restricted to the Firebase Emulator Suite. ' +
        'Permission to seed or overwrite live Firestore is NEVER inferred from GOOGLE_APPLICATION_CREDENTIALS. ' +
        'To seed the local development emulator, start emulators ("npm run emulators") or set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080.'
      );
    }

    const targetProject = (env.GCLOUD_PROJECT || env.FIREBASE_PROJECT_ID || '').trim();
    if (env.CONFIRM_MIGRATION_PROJECT_ID !== targetProject) {
      throw new Error(
        `REFUSED: CONFIRM_MIGRATION_PROJECT_ID ("${env.CONFIRM_MIGRATION_PROJECT_ID}") does not match active project ("${targetProject}").`
      );
    }

    return {
      isEmulator: false,
      projectId: targetProject,
    };
  }

  return {
    isEmulator: true,
    projectId: env.GCLOUD_PROJECT || 'solvesphere-ai-dev',
    firestoreHost: env.FIRESTORE_EMULATOR_HOST,
    authHost: env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099',
  };
}

// Automatically configure emulator host for standard dev workflow if no live flags or credentials exist
if (!process.env.FIRESTORE_EMULATOR_HOST && process.env.ALLOW_LIVE_DATABASE_MIGRATION !== 'true') {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.CONFIRM_MIGRATION_PROJECT_ID) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  }
}

async function seed() {
  const target = validateSeedTarget(process.env);

  console.log(`\n======================================================`);
  console.log(`  SolveSphere AI — Seeding Firestore Database`);
  console.log(`  Target:         ${target.isEmulator ? 'EMULATOR (' + target.firestoreHost + ')' : 'LIVE CLOUD MIGRATION'}`);
  console.log(`  Project ID:     ${target.projectId}`);
  console.log(`======================================================\n`);

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: target.projectId,
    });
  }

  const db = admin.firestore();
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

  // 6. Seed System Sequence Counter (Safe initialization: preserves existing counter if already set)
  console.log(`Initializing system complaint sequence counter...`);
  const counterRef = db.collection('systemCounters').doc('complaints');
  const counterSnap = await counterRef.get();
  if (!counterSnap.exists) {
    batch.set(counterRef, { currentSequence: 840 });
  }

  // 6b. Seed Practice Quizzes and MCQs
  console.log(`Seeding sample quizzes and question bank...`);
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
      title: 'Design Thinking: Human-Centric Ideation & Prototyping',
      description: 'Test your understanding of empathy interviews, problem reframing, and rapid user validation.',
      type: 'QUIZ',
      durationMinutes: 10,
      difficulty: 'BEGINNER',
      published: true,
      questionsCount: 2,
      createdAt: '2026-11-02T10:00:00.000Z',
      questions: [
        {
          id: 'q-dt-1',
          questionText: 'What is the primary objective of the "Empathize" stage in the 5-stage Stanford d.school Design Thinking model?',
          options: [
            'Developing a high-fidelity interactive software mockup',
            'Understanding user experiences, emotional pain points, and latent needs in their context',
            'Filtering out divergent ideas to select the single best technical solution',
            'Writing functional requirement specifications for backend microservices',
          ],
          correctOptionIndex: 1,
          explanation: 'Empathy immerses designers in the user experience to discover real human problems and latent needs without prior assumptions.',
        },
        {
          id: 'q-dt-2',
          questionText: 'Why is "Failing Fast" considered a valuable practice during the iterative Prototyping phase?',
          options: [
            'It minimizes documentation overhead by ignoring test cases',
            'It eliminates the need for user feedback sessions',
            'It allows teams to uncover flaws early at minimal cost before committing heavy engineering resources',
            'It forces project managers to cancel high-risk creative initiatives immediately',
          ],
          correctOptionIndex: 2,
          explanation: 'Low-fidelity rapid prototyping exposes false assumptions quickly and cheaply, accelerating convergence toward genuine user value.',
        },
      ],
    },
    {
      id: 'quiz-comm105',
      subjectId: 'subj-comm105',
      title: 'Professional Technical Communication & Ethical Reporting',
      description: 'Evaluate best practices in clarity, audience awareness, active listening, and technical integrity.',
      type: 'QUIZ',
      durationMinutes: 10,
      difficulty: 'BEGINNER',
      published: true,
      questionsCount: 2,
      createdAt: '2026-11-03T10:00:00.000Z',
      questions: [
        {
          id: 'q-comm-1',
          questionText: 'When delivering an engineering design presentation to a multidisciplinary audience of both technical and financial stakeholders, which strategy is most effective?',
          options: [
            'Use dense mathematical derivations without verbal executive summaries',
            'Structure communication in an inverted pyramid: start with high-level impact and objectives before diving into technical specifics',
            'Avoid stating problem statements or business constraints entirely',
            'Refuse to answer questions outside the software domain',
          ],
          correctOptionIndex: 1,
          explanation: 'An executive-first inverted pyramid structure gives diverse stakeholders the context they need to understand specialized technical contributions.',
        },
        {
          id: 'q-comm-2',
          questionText: 'If unexpected experimental results invalidate a key hypothesis in a research or progress report, what is the ethically sound response?',
          options: [
            'Quietly alter raw telemetry datasets so graphs align with desired conclusions',
            'Transparently document anomalies, report the observed variance, and propose investigative follow-ups',
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

  // 7. Seed Sample Complaints with Subcollection Timelines (Emulator Only)
  if (target.isEmulator) {
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
  }

  console.log(`\n======================================================`);
  console.log(`  Firestore Seed Complete!`);
  console.log(`======================================================\n`);
  process.exit(0);
}

// Only auto-run if directly invoked as main script
const isMain = process.argv[1] && process.argv[1].endsWith('seed-firebase.js');
if (isMain) {
  seed().catch((err) => {
    console.error('\n✖ Fatal error seeding Firestore:', err.message || err);
    process.exit(1);
  });
}
