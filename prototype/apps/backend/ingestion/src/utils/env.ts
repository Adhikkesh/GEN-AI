// Load and validate environment variables
import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  SERPAPI_KEY: z.string().min(1),
  JSEARCH_KEY: z.string().min(1),
  NEWSAPI_KEY: z.string().min(1),
  GEMINI_PROJECT_ID: z.string().min(1),
  GEMINI_LOCATION: z.string().default('us-central1'),
  BIGQUERY_DATASET: z.string().min(1),
  BIGQUERY_TABLE: z.string().min(1),
  BIGQUERY_NEWS_TABLE: z.string().min(1),
  PGVECTOR_CONNECTION_STRING: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  INGESTION_TOPIC: z.string()
});

export const env = envSchema.parse(process.env);