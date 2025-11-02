// Express routes for ingestion
import { Router } from 'express';
import { IngestionController } from '../controllers/ingestion.controller';

const router: Router = Router();
const controller = new IngestionController();

router.post('/ingest', controller.triggerIngestion.bind(controller));
router.post('/manual-job', controller.manualAddJob.bind(controller));
router.post('/manual-text', controller.manualAddText.bind(controller));

export default router;