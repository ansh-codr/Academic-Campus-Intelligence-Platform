import * as admin from 'firebase-admin';
import { createComplaint } from './complaints.js';
import { updateTicketStatus, assignTicketDepartment } from './admin.js';

// Initialize Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}

export { createComplaint, updateTicketStatus, assignTicketDepartment };
