import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

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

test('fixtures directory is absent from production client source tree', () => {
  assert.equal(existsSync(new URL('../apps/web/src/fixtures', import.meta.url)), false, 'apps/web/src/fixtures must not exist in client source tree');
});

test('legacy useAuthDemo and 1-click demo credentials are absent from client source tree', () => {
  assert.equal(existsSync(new URL('../apps/web/src/hooks/useAuthDemo.tsx', import.meta.url)), false, 'useAuthDemo.tsx must not exist in client source tree');
  
  const authHook = read('apps/web/src/hooks/useAuth.tsx');
  assert.doesNotMatch(authHook, /student\.demo@campus\.edu|Student@2026|SolveSphereAdmin@2026|loginAsStudent|loginAsAdmin/);

  const studentLogin = read('apps/web/src/pages/auth/StudentLoginPage.tsx');
  assert.doesNotMatch(studentLogin, /1-Click Sign In|loginAsStudent|Aarav Sharma/);

  const adminLogin = read('apps/web/src/pages/auth/AdminLoginPage.tsx');
  assert.doesNotMatch(adminLogin, /1-Click Sign In|loginAsAdmin|Vikram Malhotra/);

  const studentRegister = read('apps/web/src/pages/auth/StudentRegisterPage.tsx');
  assert.doesNotMatch(studentRegister, /Aarav Sharma|CS26019/);
});
