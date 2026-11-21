import admin from 'firebase-admin';
import { createComplaint, reopenTicket } from './complaints.js';
import {
  updateTicketStatus,
  assignTicketDepartment,
  adminManageDepartment,
  adminManageClub,
  adminReviewCluster,
} from './admin.js';
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
  reopenTicket,
  updateTicketStatus,
  assignTicketDepartment,
  adminManageDepartment,
  adminManageClub,
  adminReviewCluster,
  getQuizQuestions,
  submitQuiz,
  adminSaveQuiz,
  adminDeleteQuiz,
  adminUpdateTopicStatus,
  toggleStudentTopicProgress,
  askStudyMateAi,
};
