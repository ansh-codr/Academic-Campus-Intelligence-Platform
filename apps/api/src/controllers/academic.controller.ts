import { Request, Response } from 'express';
import { SUBJECTS, TOPICS, RESOURCES } from '../services/academic.service.js';

export const AcademicController = {
  getSubjects(_req: Request, res: Response) {
    res.json({
      success: true,
      data: SUBJECTS,
    });
  },

  getSubjectById(req: Request, res: Response) {
    const { id } = req.params;
    const subject = SUBJECTS.find((s) => s.id === id || s.code.toLowerCase() === id.toLowerCase());
    if (!subject) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Subject '${id}' not found` },
      });
    }
    const topics = TOPICS.filter((t) => t.subjectId === subject.id);
    const resources = RESOURCES.filter((r) => r.subjectId === subject.id);

    return res.json({
      success: true,
      data: {
        ...subject,
        topics,
        resources,
      },
    });
  },

  getTimeline(req: Request, res: Response) {
    const { subjectId } = req.query;
    let topics = TOPICS;
    if (subjectId && typeof subjectId === 'string') {
      topics = topics.filter((t) => t.subjectId === subjectId);
    }
    const completed = topics.filter((t) => t.status === 'COMPLETED');
    const ongoing = topics.filter((t) => t.status === 'ONGOING');
    const upcoming = topics.filter((t) => t.status === 'UPCOMING');

    res.json({
      success: true,
      data: {
        summary: {
          total: topics.length,
          completedCount: completed.length,
          ongoingCount: ongoing.length,
          upcomingCount: upcoming.length,
        },
        timeline: {
          completed,
          ongoing,
          upcoming,
        },
      },
    });
  },

  getResources(req: Request, res: Response) {
    const { subjectId, scope } = req.query;
    let resources = RESOURCES;
    if (subjectId && typeof subjectId === 'string') {
      resources = resources.filter((r) => r.subjectId === subjectId);
    }
    if (scope && typeof scope === 'string') {
      resources = resources.filter((r) => r.scope === scope);
    }

    res.json({
      success: true,
      data: resources,
    });
  },
};
