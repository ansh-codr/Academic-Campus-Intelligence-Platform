import admin from 'firebase-admin';
import {
  createComplaint,
  reopenTicket,
  onComplaintCreatedClustering,
  recoverStaleComplaintLeases,
} from './complaints.js';
import {
  updateTicketStatus,
  assignTicketDepartment,
  adminManageDepartment,
  adminManageClub,
  adminReviewCluster,
  adminApproveEnrollment,
  adminRejectEnrollment,
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
import { askCampusCareAi, aiAssistComplaint } from './campusCare.js';

// Initialize Admin SDK once if running in Firebase Cloud Functions / Emulator environment
if (!admin.apps.length && (process.env.K_SERVICE || process.env.FUNCTION_NAME || process.env.FUNCTIONS_EMULATOR)) {
  admin.initializeApp();
}

export {
  createComplaint,
  reopenTicket,
  onComplaintCreatedClustering,
  recoverStaleComplaintLeases,
  updateTicketStatus,
  assignTicketDepartment,
  adminManageDepartment,
  adminManageClub,
  adminReviewCluster,
  adminApproveEnrollment,
  adminRejectEnrollment,
  getQuizQuestions,
  submitQuiz,
  adminSaveQuiz,
  adminDeleteQuiz,
  adminUpdateTopicStatus,
  toggleStudentTopicProgress,
  askStudyMateAi,
  askCampusCareAi,
  aiAssistComplaint,
};
