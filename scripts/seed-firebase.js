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
import { FIXTURE_SUBJECTS, FIXTURE_TOPICS, FIXTURE_RESOURCES } from '../apps/web/src/fixtures/academicFixtures.js';
import { FIXTURE_CLUBS, FIXTURE_TICKETS, FIXTURE_CLUSTERS } from '../apps/web/src/fixtures/campusFixtures.js';

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

  await batch.commit();
  console.log(`\n✓ Base batch committed successfully!`);

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
