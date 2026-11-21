import { Request, Response } from 'express';
import { CampusService } from '../services/campus.service.js';

export const CampusController = {
  getTickets(_req: Request, res: Response) {
    const tickets = CampusService.getTickets();
    res.json({
      success: true,
      data: tickets,
    });
  },

  createTicket(req: Request, res: Response) {
    const ticket = CampusService.createTicket(req.body);
    res.status(201).json({
      success: true,
      message: 'Demo Ticket submitted successfully. (Phase 1 local in-memory store)',
      data: ticket,
    });
  },

  getClusters(_req: Request, res: Response) {
    const clusters = CampusService.getClusters();
    res.json({
      success: true,
      data: clusters,
    });
  },

  getClubs(_req: Request, res: Response) {
    const clubs = CampusService.getClubs();
    res.json({
      success: true,
      data: clubs,
    });
  },

  submitSpeakFreely(req: Request, res: Response) {
    const { category, description } = req.body;
    const report = CampusService.submitSpeakFreely(category, description);
    res.status(201).json({
      success: true,
      message: 'Sensitive concern recorded in demo preview. Notice: Production zero-knowledge workflow will be available in Phase 2.',
      data: report,
    });
  },
};
