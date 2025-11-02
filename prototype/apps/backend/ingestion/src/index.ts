import * as functions from '@google-cloud/functions-framework'; // <-- 1. THIS IS THE FIX
import { PubSub } from '@google-cloud/pubsub';
import { Request, Response } from 'express';
// DO NOT import IngestionService here
import { env } from './utils/env';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
  console.log('Firebase Admin initialized.');
}
// Initialize PubSub client
const pubsub = new PubSub();
const topicName = env.INGESTION_TOPIC || 'run-ingestion';

/**
 * 1. HTTP-triggered Cloud Function
 * This function is lightweight and will not crash.
 */
functions.http('ingestTrigger', async (req: Request, res: Response) => {
  try {
    const { careerId } = req.body;
    const messagePayload = { careerId: careerId || null };
    const dataBuffer = Buffer.from(JSON.stringify(messagePayload));

    const messageId = await pubsub.topic(topicName).publishMessage({ data: dataBuffer });

    console.log(`Message ${messageId} published.`);
    res.status(202).send({
      success: true,
      message: 'Ingestion process triggered.',
      messageId: messageId,
    });
  } catch (error) {
    console.error('Failed to trigger ingestion:', error);
    res.status(500).send({ success: false, error: 'Failed to trigger ingestion.' });
  }
});


/**
 * 2. Pub/Sub-triggered Cloud Function (The Worker)
 * This function dynamically imports the heavy service.
 */
functions.cloudEvent('ingestionWorker', async (cloudEvent: any) => {
  // Decode the message
  const base64Data = cloudEvent.data.message.data;
  const decodedData = base64Data ? Buffer.from(base64Data, 'base64').toString() : '{}';
  const { careerId } = JSON.parse(decodedData);

  console.log(`Starting ingestion worker. CareerID: ${careerId || 'all'}`);

  // 2. KEEP THIS DYNAMIC IMPORT
  // This loads the heavy code only when the worker runs.
  const { IngestionService } = await import('./services/ingestion.service.js');
  const ingestionService = new IngestionService();

  try {
    const result = await ingestionService.runIngestion(careerId);
    console.log('Ingestion worker finished successfully:', result);

  } catch (error) {
    console.error('Ingestion worker failed:', error);
    
  } finally {
    // CRITICAL: Always disconnect your clients
    await ingestionService.storageSvc.disconnect();
    console.log('Database connections closed.');
  }
});