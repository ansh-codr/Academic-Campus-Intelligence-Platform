import { Request, Response } from 'express';
import { ADMIN_METRICS, DEPARTMENT_WORKLOAD, RECENT_ADMIN_ACTIVITIES } from '../services/admin.service.js';
import { CampusService } from '../services/campus.service.js';
import { SUBJECTS } from '../services/academic.service.js';

export const AdminController = {
  getOverview(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        metrics: ADMIN_METRICS,
        departmentWorkload: DEPARTMENT_WORKLOAD,
        recentActivities: RECENT_ADMIN_ACTIVITIES,
        activeClusters: CampusService.getClusters(),
      },
    });
  },

  getWorkload(_req: Request, res: Response) {
    res.json({
      success: true,
      data: DEPARTMENT_WORKLOAD,
    });
  },

  getClusters(_req: Request, res: Response) {
    res.json({
      success: true,
      data: CampusService.getClusters(),
    });
  },

  getAcademicOverview(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        totalSubjects: SUBJECTS.length,
        subjects: SUBJECTS,
      },
    });
  },
};
