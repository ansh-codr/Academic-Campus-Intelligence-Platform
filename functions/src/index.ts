import * as admin from 'firebase-admin';
import { createComplaint } from './complaints.js';
import { updateTicketStatus, assignTicketDepartment } from './admin.js';
import {
  getQuizQuestions,
  submitQuiz,
  adminSaveQuiz,
  adminDeleteQuiz,
  adminUpdateTopicStatus,
  toggleStudentTopicProgress,
} from './academic.js';

// Initialize Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}

export {
  createComplaint,
  updateTicketStatus,
  assignTicketDepartment,
  getQuizQuestions,
  submitQuiz,
  adminSaveQuiz,
  adminDeleteQuiz,
  adminUpdateTopicStatus,
  toggleStudentTopicProgress,
};
