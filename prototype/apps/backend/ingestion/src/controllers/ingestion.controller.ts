// Controller for ingestion endpoints
import { Request, Response } from 'express';
import { IngestionService } from '../services/ingestion.service';  // Main orchestrator
import { StandardizedJob } from 'src/types/job.types';

export class IngestionController {
  private service = new IngestionService();

  async triggerIngestion(req: Request, res: Response): Promise<void> {
    const { careerId } = req.body;  // Optional: Single career for testing
    const result = await this.service.runIngestion(careerId);
    res.json(result);
  }

  async manualAddJob(req: Request, res: Response): Promise<void> {
    const jobData = req.body as Partial<StandardizedJob>;
    await this.service.manualAddToBigQuery(jobData);
    res.json({ success: true, message: 'Job added to BigQuery' });
  }

  async manualAddText(req: Request, res: Response): Promise<void> {
    const { text, sourceId } = req.body;
    await this.service.manualAddToVectorDB(text, sourceId);
    res.json({ success: true, message: 'Text embedding added to Vector DB' });
  }
}