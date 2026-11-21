const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../apps/web/src');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');

test('all required product routes remain registered',()=>{
  const app=read('App.tsx');
  for(const route of [
    '/auth/login','/auth/register','/auth/admin-login','/portal','/admin',
    'overview','academic','subjects','timeline','resources','studymate','practice',
    'campus','report','tickets','speak-freely','clubs','profile','settings',
    'dashboard','complaints','clusters','analytics'
  ]) assert.ok(app.includes('path="'+route+'"'), 'Missing route '+route);
});
test('protected student and admin workspaces preserve authentication guards',()=>{
  const app=read('App.tsx');
  assert.match(app,/RequireAuth/);
  assert.match(app,/RequireAdmin/);
  assert.match(app,/role\s*!==\s*'ADMIN'/);
});
test('backend adapters are still referenced by workspace pages',()=>{
  assert.match(read('pages/student/StudentOverviewPage.tsx'),/AcademicService\.getSubjects/);
  assert.match(read('pages/student/StudentOverviewPage.tsx'),/CampusService\.getTickets/);
  assert.match(read('pages/student/ReportIssuePage.tsx'),/CampusService\.createTicket/);
  assert.match(read('pages/admin/AdminDashboardPage.tsx'),/AdminService\.getOverview/);
});
test('visual foundation supports keyboard interaction and reduced motion',()=>{
  const css=read('styles/index.css');
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(read('components/ui/Modal.tsx'),/aria-modal="true"/);
  assert.match(read('components/ui/Tabs.tsx'),/role="tablist"/);
});
test('marketing preview never claims real analytics data',()=>{
  const hero=read('pages/landing/LandingPage.tsx');
  const preview=read('components/marketing/PlatformShowcase.tsx');
  assert.match(hero,/Get Started Free/);
  assert.match(preview,/Sample view/);
});
