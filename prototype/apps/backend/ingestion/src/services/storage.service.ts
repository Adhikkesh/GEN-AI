// src/services/storage.service.ts

import { BigQuery } from '@google-cloud/bigquery';
import { Pool } from 'pg';
import admin from 'firebase-admin';
import { env } from '../utils/env';
import { StandardizedJob } from '../types/job.types';
import { StandardizedNews } from '../types/news.types';
import { ProcessingService } from './processing.service';

// Define interface for Pool methods we use
interface PoolInterface {
  query(text: string, params?: unknown[]): Promise<{ rows: Array<{ id?: string }> }>;
  on(event: 'error', handler: (err: Error, client: unknown) => void): void;
  end(): Promise<void>;
}

export class StorageService {
  private bigquery: BigQuery;
  private pgPool: PoolInterface;
  private db = admin.firestore();
  private processingService: ProcessingService;
  private poolEnded: boolean = false;  // FIX: Flag to prevent races on pool end

  constructor(processingService: ProcessingService) {
    this.bigquery = new BigQuery({ projectId: env.GEMINI_PROJECT_ID });
    
    this.pgPool = new Pool({
      connectionString: env.PGVECTOR_CONNECTION_STRING,
      ssl: { 
        rejectUnauthorized: false 
      }
    }) as unknown as PoolInterface;

    this.pgPool.on('error', (err: Error, client: unknown) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
    
    this.processingService = processingService;
  }

  async storeToBigQuery(job: StandardizedJob): Promise<void> {
    try {
      // Mapping aligned exactly to schema
      // KEY FIX: Added ingestion_source (REQUIRED field missing in prior runs)
      // skills as array (REPEATED STRING)
      // Defensive defaults for all NULLABLE fields
      const jobForBigQuery = {
        source_job_id: job.source_job_id,
        ingestion_source: job.ingestion_source || 'Unknown',  // REQUIRED: Add back
        ingested_at: job.ingested_at || new Date().toISOString(),
        career_query: job.career_query || 'unknown',
        title: (job.cleaned_title || job.raw_title) || 'N/A',
        company_name: job.raw_company_name || 'Unknown',
        description: (job.cleaned_description || job.raw_description) || 'N/A',
        skills: job.skills_list || [],  // Array of strings—matches REPEATED STRING
        employment_type: job.employment_type || null,
        is_remote: job.is_remote ?? false,
        salary_text: job.salary_text || null,
        location_text: job.location_text || 'Unknown',
        city: job.city || null,
        state: job.state || null,
        country_code: job.country_code || 'IN',
        apply_link: job.apply_link || null,
        source_platform: job.source_platform || 'Unknown',
        posted_at: job.posted_at || null,
      };

      const dataset = this.bigquery.dataset(env.BIGQUERY_DATASET);
      const table = dataset.table(env.BIGQUERY_TABLE);

      const [response] = await table.insert([jobForBigQuery], { 
        ignoreUnknownValues: true,
        skipInvalidRows: true  // Skip invalid rows instead of failing
      });

      // Check for insert errors post-insert
      if ('insertErrors' in response && response.insertErrors && response.insertErrors.length > 0) {
        console.warn(`Partial insert for job ${job.source_job_id}:`, response.insertErrors);
        throw new Error(`Partial failure: ${JSON.stringify(response.insertErrors[0])}`);
      }

      console.log(`Stored job ${job.source_job_id} to BigQuery`);
    } catch (error: any) {
      // Detailed logging for debugging
      console.error(`Failed to store job ${job.source_job_id} to BigQuery:`);
      console.error('Full Error:', JSON.stringify(error, null, 2));
      if (error.errors) {
        console.error('Insert Errors Details:');
        error.errors.forEach((err: any, idx: number) => {
          if (err.errors && err.errors.length > 0) {
            console.error(`Row ${idx} - Location: ${err.errors[0].location}, Reason: ${err.errors[0].reason}, Message: ${err.errors[0].message}`);
          }
        });
      }
      throw error;  // Re-throw to halt on failure
    }
  }

  async storeNewsToBigQuery(news: StandardizedNews): Promise<void> {
    try {
      // Mapping implicitly matches schema (all fields present and NULLABLE except newsId/ingested_at)
      const newsForBigQuery = {
        newsId: news.newsId,
        title: news.title || 'N/A',
        description: news.description || 'N/A',
        source: news.source || 'Unknown',
        url: news.url || null,
        category: news.category || 'general',
        search_query: news.search_query || 'unknown',
        language: news.language || 'en',
        thumbnail: news.thumbnail || null,
        published_at: news.published_at || null,
        ingested_at: news.ingested_at || new Date().toISOString(),
        updated_at: news.updated_at || new Date().toISOString(),
        position: news.position || 0,
        ingestion_source: news.ingestion_source || 'Unknown',
        is_active: news.is_active ?? true,
        raw_data: news.raw_data || { date_text: 'N/A', position: 0, search_metadata_id: 'N/A' },
      };

      const dataset = this.bigquery.dataset(env.BIGQUERY_DATASET);
      const table = dataset.table(env.BIGQUERY_NEWS_TABLE);
      const [response] = await table.insert([newsForBigQuery], { 
        ignoreUnknownValues: true,
        skipInvalidRows: true 
      });

      if ('insertErrors' in response && response.insertErrors && response.insertErrors.length > 0) {
        console.warn(`Partial insert for news ${news.newsId}:`, response.insertErrors);
      }

      console.log(`Stored news ${news.newsId} to BigQuery`);
    } catch (error: any) {
      console.error(`Failed to store news ${news.newsId} to BigQuery:`, error);
      if (error.errors) {
        console.error('News Insert Errors:', JSON.stringify(error.errors, null, 2));
      }
      throw error;
    }
  }

  async storeEmbeddingToVectorDB(
    id: string,
    textToShow: string,
    embedding: number[],
    contentType: 'job' | 'news',
    sourceId?: string
  ): Promise<void> {
    // FIX: Check if pool is ended to avoid race
    if (this.poolEnded) {
      console.warn(`Pool ended; skipping embedding store for ${sourceId || id}`);
      return;
    }

    const embeddingVector = `[${embedding.join(',')}]`;
    const query = `
      INSERT INTO embeddings (id, source_id, content_type, text_to_show, embedding, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, NOW())
      ON CONFLICT (source_id, content_type) DO UPDATE SET
        text_to_show = EXCLUDED.text_to_show,
        embedding = EXCLUDED.embedding,
        updated_at = NOW()
      RETURNING id;
    `;
    
    try {
      const result = await this.pgPool.query(query, [
        sourceId || id,
        contentType,
        textToShow,
        embeddingVector,
      ]);
      console.log(`✅ Stored embedding for "${sourceId || id}" (${contentType}) — row ID: ${result.rows[0]?.id}`);
    } catch (error) {
      console.error(`Failed to store embedding for ${sourceId || id}:`, error);
      throw error;
    }
  }

  async overwriteFirestoreJobs(careerId: string, jobs: StandardizedJob[]): Promise<void> {
    try {
      const batch = this.db.batch();
      const listingsRef = this.db.collection(`career_jobs/${careerId}/listings`);
      const oldSnapshot = await listingsRef.get();
      oldSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      jobs.forEach((job) => {
        const docRef = listingsRef.doc(job.source_job_id);
        batch.set(docRef, job);
      });
      await batch.commit();
      console.log(`Overwrote Firestore jobs for ${careerId}`);
    } catch (error) {
      console.error(`Failed to overwrite Firestore jobs for ${careerId}:`, error);
      throw error;
    }
  }

  async overwriteFirestoreNews(careerId: string, news: StandardizedNews[]): Promise<void> {
    try {
      const batch = this.db.batch();
      const articlesRef = this.db.collection(`career_news/${careerId}/articles`);
      const oldSnapshot = await articlesRef.get();
      oldSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      news.forEach((article) => {
        const docRef = articlesRef.doc(article.newsId);
        batch.set(docRef, article);
      });
      await batch.commit();
      console.log(`Overwrote Firestore news for ${careerId}`);
    } catch (error) {
      console.error(`Failed to overwrite Firestore news for ${careerId}:`, error);
      throw error;
    }
  }

  async manualAddJob(row: Partial<StandardizedJob>): Promise<void> {
    const fullJob = { ...row, ingested_at: new Date().toISOString() } as StandardizedJob;
    await this.storeToBigQuery(fullJob);
  }

  async manualAddText(text: string, sourceId?: string): Promise<void> {
    try {
      const embeddings = await this.processingService.getEmbedding([text]);
      const embedding = embeddings[0] || new Array(768).fill(0);
      await this.storeEmbeddingToVectorDB(sourceId || `manual-${Date.now()}`, text, embedding, 'news');
    } catch (error) {
      console.error(`Failed to manually add text "${text}":`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.poolEnded) return;
      this.poolEnded = true;  // FIX: Set flag before end
      await this.pgPool.end();
      console.log('PostgreSQL pool has been closed.');
    } catch (error) {
      console.error('Error during PG pool disconnect:', error);
    }
  }
}