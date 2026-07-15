import { Request, Response } from 'express';
import { WhatsAppService } from '../services/WhatsAppService';

export class EvolutionController {
  private wpService = new WhatsAppService();

  async getStatus(req: Request, res: Response) {
    try {
      const state = await this.wpService.getConnectionState();
      return res.json(state);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const result = await this.wpService.createInstance();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async connect(req: Request, res: Response) {
    try {
      const result = await this.wpService.connectInstance();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const result = await this.wpService.logoutInstance();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
