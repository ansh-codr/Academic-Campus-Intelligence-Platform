import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('live academic, campus and admin services do not import demonstration fixtures', () => {
  for (const service of ['academicService.ts', 'campusService.ts', 'adminService.ts']) {
    const code = read(`apps/web/src/services/${service}`);
    assert.doesNotMatch(code, /FIXTURE_[A-Z_]+|@\/fixtures\//);
  }
});

test('quiz outcomes cannot be fabricated in the frontend', () => {
  const code = read('apps/web/src/services/academicService.ts');
  assert.doesNotMatch(code, /mockAttempt|student-demo|q-demo-|percentage:\s*100/);
  assert.match(code, /'submitQuiz'/);
  assert.match(code, /'getQuizQuestions'/);
});

test('privileged admin mutations use Firebase callable Cloud Functions', () => {
  const code = read('apps/web/src/services/adminService.ts');
  for (const callable of ['updateTicketStatus', 'assignTicketDepartment', 'adminManageDepartment', 'adminManageClub', 'adminReviewCluster']) {
    assert.ok(code.includes(callable), `missing trusted callable: ${callable}`);
  }
  assert.doesNotMatch(code, /updateDoc\(|setDoc\(|writeBatch\(/);
});

test('legacy seeded club membership and admin preview are absent', () => {
  assert.doesNotMatch(read('apps/web/src/pages/student/CampusClubsPage.tsx'), /joinedClubIds|Join Society Roster|Leave Club \(Demo\)/);
  assert.doesNotMatch(read('apps/web/src/pages/admin/AdminDashboardPage.tsx'), /Phase 1 Full-Stack Notice/);
});
