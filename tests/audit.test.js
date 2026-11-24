import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateTicketSchema } from '@solvesphere/shared';
import { validateAdminBootstrapConfig } from '../scripts/bootstrap-admin.js';
import { createComplaint } from '../functions/src/complaints.ts';

test('creating a ticket requires no function secrets', () => {
  assert.deepEqual(createComplaint.__endpoint.secretEnvironmentVariables ?? [], []);
});

test('ticket contracts bound attachment count and location length', () => {
  const ticket = { title: 'Repair request', category: 'HOSTEL', building: 'West', floor: '1', room: '4', description: 'Please repair the window latch.' };
  assert.ok(CreateTicketSchema.safeParse(ticket).success);
  assert.equal(CreateTicketSchema.safeParse({...ticket, room: 'a'.repeat(256)}).success, false);
  assert.equal(CreateTicketSchema.safeParse({...ticket, attachmentUrls: Array(6).fill('sample')}).success, false);
});

test('bootstrap validation never echoes a supplied password', () => {
  const password = 'password-' + crypto.randomUUID();
  assert.throws(() => validateAdminBootstrapConfig({
    ADMIN_PASSWORD: password, ADMIN_EMAIL: 'test@example.invalid',
    CONFIRM_PROD_ADMIN_BOOTSTRAP: 'true', GCLOUD_PROJECT: 'demo-audit'
  }), err => !err.message.includes(password));
});
