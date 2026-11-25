import type { IncomingMessage, ServerResponse } from 'node:http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'online',
    platform: 'SolveSphere AI — Vercel Serverless Gateway',
    timestamp: new Date().toISOString(),
    supportedEndpoints: [
      'adminApproveEnrollment',
      'adminRejectEnrollment',
      'createComplaint',
      'reopenTicket',
      'updateTicketStatus',
      'assignTicketDepartment',
      'adminManageDepartment',
      'adminManageClub',
      'adminReviewCluster',
      'getQuizQuestions',
      'submitQuiz',
      'adminSaveQuiz',
      'adminDeleteQuiz',
      'adminUpdateTopicStatus',
      'toggleStudentTopicProgress',
      'askStudyMateAi',
      'askCampusCareAi',
      'aiAssistComplaint'
    ]
  }));
}
