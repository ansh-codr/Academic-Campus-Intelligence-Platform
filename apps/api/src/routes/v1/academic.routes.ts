import { Router } from 'express';
import { AcademicController } from '../../controllers/academic.controller.js';

export const academicRouter = Router();

academicRouter.get('/subjects', AcademicController.getSubjects);
academicRouter.get('/subjects/:id', AcademicController.getSubjectById);
academicRouter.get('/timeline', AcademicController.getTimeline);
academicRouter.get('/resources', AcademicController.getResources);
