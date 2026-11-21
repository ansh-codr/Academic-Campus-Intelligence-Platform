import admin from 'firebase-admin';
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
import { askStudyMateAi } from './studymate.js';

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
  askStudyMateAi,
};
