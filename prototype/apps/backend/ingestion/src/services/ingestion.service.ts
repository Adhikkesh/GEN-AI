// src/services/ingestion.service.ts

import { CareerService } from "./career.service";
import { JobFetchService } from "./job-fetch.service";
import { NewsFetchService } from "./news-fetch.service";
import { ProcessingService } from "./processing.service";
import { StorageService } from "./storage.service";
import { ActiveCareer } from "../types/career.types";
import { StandardizedJob } from "../types/job.types";
import { StandardizedNews } from "../types/news.types";
import { ApiResponse } from "../types/common.types";

interface ProcessedItem<T> {
  processed: T;
  embedding: number[];
}

type JobProcessedItem = ProcessedItem<StandardizedJob>;
type NewsProcessedItem = ProcessedItem<StandardizedNews>;

interface CareerCounts {
  jobCount: number;
  newsCount: number;
}

export class IngestionService {
  // Declare services
  private readonly careerSvc: CareerService;
  private readonly jobFetchSvc: JobFetchService;
  private readonly newsFetchSvc: NewsFetchService;
  private readonly processingSvc: ProcessingService;
  public readonly storageSvc: StorageService;

  constructor() {
    this.careerSvc = new CareerService();
    this.jobFetchSvc = new JobFetchService();
    this.newsFetchSvc = new NewsFetchService();
    this.processingSvc = new ProcessingService();
    this.storageSvc = new StorageService(this.processingSvc);
  }

  async runIngestion(
    singleCareerId?: string
  ): Promise<ApiResponse<{ processedJobs: number; processedNews: number }>> {
    try {
      // 1. Get active careers
      const careersRes = await this.careerSvc.getActiveCareers();
      if (!careersRes.success || !careersRes.data) {
        return {
          success: false,
          error: careersRes.error || "Failed to fetch active careers",
        };
      }
      const careers: ActiveCareer[] = singleCareerId
        ? [
            {
              id: singleCareerId,
              displayName: singleCareerId,
              userCount: 1,
            } as ActiveCareer,
          ]
        : careersRes.data;

      let totalJobs: number = 0;
      let totalNews: number = 0;

      const BATCH_SIZE: number = 1; // Reduced: 1 career per batch
      const CHUNK_SIZE: number = 1; // 1 item per chunk
      const DELAY_BETWEEN_REFINEMENTS_MS: number = 5000; // 1s per refine
      const DELAY_BETWEEN_CHUNKS_MS: number = 5000; // 2s per chunk

      const careerBatches: ActiveCareer[][] = [];
      for (let i = 0; i < careers.length; i += BATCH_SIZE) {
        careerBatches.push(careers.slice(i, i + BATCH_SIZE));
      }

      // Loop 1: Process batches serially
      for (const batch of careerBatches) {
        // Process careers WITHIN the batch (batch size is 1 here)
        const batchPromises: Promise<CareerCounts>[] = batch.map(
          async (career: ActiveCareer): Promise<CareerCounts> => {
            console.log(
              `Processing career: ${career.displayName} (${career.id})`
            );

            // --- 2. FETCH JOBS ---
            const jobsRes = await this.jobFetchSvc.fetchJobsForCareer(
              career.displayName
            );
            if (!jobsRes.success || !jobsRes.data) {
              console.warn(
                `Skipping jobs for ${career.displayName}: Failed to fetch`
              );
              return { jobCount: 0, newsCount: 0 };
            }

            // Normalize jobs from both sources into StandardizedJob[]
            const allRawJobs: StandardizedJob[] = [
              ...(jobsRes.data.serpapi ?? []).map((job: any) =>
                this.jobFetchSvc.normalizeJob(
                  job,
                  "SerpApi",
                  career.displayName
                )
              ),
              ...(jobsRes.data.jsearch ?? []).map((job: any) =>
                this.jobFetchSvc.normalizeJob(
                  job,
                  "JSearch",
                  career.displayName
                )
              ),
            ];

            // --- 3. PROCESS JOBS (SERIAL REFINEMENT) ---
            const allProcessedJobs: JobProcessedItem[] = [];

            for (
              let jobChunkStart = 0;
              jobChunkStart < allRawJobs.length;
              jobChunkStart += CHUNK_SIZE
            ) {
              console.log(
                `  Processing job chunk ${Math.floor(jobChunkStart / CHUNK_SIZE) + 1} for ${career.displayName}`
              );
              const jobChunk: StandardizedJob[] = allRawJobs.slice(
                jobChunkStart,
                jobChunkStart + CHUNK_SIZE
              );

              // const jobRefinedTexts: string[] = []; // DISABLED

              // Serial: refine each item in the chunk
              for (let j = 0; j < jobChunk.length; j++) {
                const rawJob = jobChunk[j];
                if (!rawJob) continue; // ✅ guard

                const { cleaned_title, cleaned_description, skills_list } =
                  await this.processingSvc.refineWithGemini(
                    `${rawJob.raw_title ?? ""} ${rawJob.raw_description ?? ""}`,
                    "job"
                  );

                const processed: StandardizedJob = {
                  ...rawJob,
                  cleaned_title: cleaned_title ?? rawJob.raw_title,
                  cleaned_description:
                    cleaned_description ?? rawJob.raw_description,
                  skills_list: skills_list ?? [],
                };

                // ✅ Ensure refined text parts are strings
                // jobRefinedTexts.push( // DISABLED
                //   `${processed.cleaned_title ?? ""} ${processed.cleaned_description ?? ""} ${(processed.skills_list ?? []).join(" ")}`
                // );
                allProcessedJobs.push({ processed, embedding: [] });

                // ✅ Delay after refinement (unless truly last)
                if (
                  j < jobChunk.length - 1 ||
                  jobChunkStart + CHUNK_SIZE < allRawJobs.length
                ) {
                  console.log(
                    `    Delaying ${DELAY_BETWEEN_REFINEMENTS_MS / 1000}s after refinement...`
                  );
                  await new Promise<void>((resolve) =>
                    setTimeout(resolve, DELAY_BETWEEN_REFINEMENTS_MS)
                  );
                }
              }

              // --- EMBEDDINGS DISABLED ---
              // // ✅ Batch embed (for the refined texts)
              // const jobEmbeddings: number[][] = jobRefinedTexts.length
              //   ? await this.processingSvc.getEmbedding(jobRefinedTexts)
              //   : [];
              //
              // jobEmbeddings.forEach((embedding: number[], idx: number) => {
              //   const targetJob =
              //     allProcessedJobs[
              //       allProcessedJobs.length - jobChunk.length + idx
              //     ];
              //   if (targetJob) targetJob.embedding = embedding;
              // });
              // --- END EMBEDDINGS DISABLED ---


              // Store parallel (DB safe)
              const jobStorePromises: Promise<void>[] = allProcessedJobs
                .slice(-jobChunk.length)
                .map(
                  async ({
                    processed,
                    embedding, // (unused)
                  }: JobProcessedItem): Promise<void> => {
                    // Only store to BigQuery
                    await this.storageSvc.storeToBigQuery(processed);

                    // --- EMBEDDINGS DISABLED ---
                    // await Promise.all([
                    //   this.storageSvc.storeToBigQuery(processed),
                    //   this.storageSvc.storeEmbeddingToVectorDB(
                    //     processed.source_job_id,
                    //     `${processed.cleaned_title ?? ""} ${processed.cleaned_description ?? ""}`,
                    //     embedding,
                    //     "job",
                    //     processed.source_job_id
                    //   ),
                    // ]);
                    // --- END EMBEDDINGS DISABLED ---
                  }
                );
              await Promise.all(jobStorePromises);

              // Chunk delay (if not last)
              if (jobChunkStart + CHUNK_SIZE < allRawJobs.length) {
                console.log(
                  `  Delaying ${DELAY_BETWEEN_CHUNKS_MS / 1000}s after job chunk...`
                );
                await new Promise<void>((resolve) =>
                  setTimeout(resolve, DELAY_BETWEEN_CHUNKS_MS)
                );
              }
            }

            // Firestore write for jobs (unchanged)
            await this.storageSvc.overwriteFirestoreJobs(
              career.id,
              allProcessedJobs.map((p: JobProcessedItem) => p.processed)
            );
            let careerJobCount: number = allProcessedJobs.length;

            // --- 4. FETCH & PROCESS NEWS (SERIAL PATTERN) ---
            const newsRes = await this.newsFetchSvc.fetchNewsForCareer(
              career.displayName
            );
            if (!newsRes.success || !newsRes.data) {
              console.warn(
                `Skipping news for ${career.displayName}: Failed to fetch`
              );
              return { jobCount: careerJobCount, newsCount: 0 };
            }

            // `newsRes.data` assumed to be already standardized to StandardizedNews[]
            const standardizedNewsList: StandardizedNews[] = newsRes.data.slice(
              0,
              10
            );

            const allProcessedNews: NewsProcessedItem[] = [];

            for (
              let newsChunkStart = 0;
              newsChunkStart < standardizedNewsList.length;
              newsChunkStart += CHUNK_SIZE
            ) {
              console.log(
                `  Processing news chunk ${Math.floor(newsChunkStart / CHUNK_SIZE) + 1} for ${career.displayName}`
              );
              const newsChunk: StandardizedNews[] = standardizedNewsList.slice(
                newsChunkStart,
                newsChunkStart + CHUNK_SIZE
              );
              // const newsRefinedTexts: string[] = []; // DISABLED

              // Serial refinement for news
              for (let j = 0; j < newsChunk.length; j++) {
                const newsItem = newsChunk[j];
                if (!newsItem) continue; // ✅ guard

                const { cleaned_title, cleaned_description } =
                  await this.processingSvc.refineWithGemini(
                    `${newsItem.title ?? ""} ${newsItem.description ?? ""}`,
                    "news"
                  );

                const processed: StandardizedNews = {
                  ...newsItem,
                  title: cleaned_title ?? newsItem.title,
                  description: cleaned_description ?? newsItem.description,
                };

                // newsRefinedTexts.push( // DISABLED
                //   `${processed.title ?? ""} ${processed.description ?? ""}`
                // );
                allProcessedNews.push({ processed, embedding: [] });

                // ✅ Delay after refinement
                if (
                  j < newsChunk.length - 1 ||
                  newsChunkStart + CHUNK_SIZE < standardizedNewsList.length
                ) {
                  console.log(
                    `    Delaying ${DELAY_BETWEEN_REFINEMENTS_MS / 1000}s after news refinement...`
                  );
                  await new Promise<void>((resolve) =>
                    setTimeout(resolve, DELAY_BETWEEN_REFINEMENTS_MS)
                  );
                }
              }

              // --- EMBEDDINGS DISABLED ---
              // // ✅ Batch embed for newsRefinedTexts
              // const newsEmbeddings: number[][] = newsRefinedTexts.length
              //   ? await this.processingSvc.getEmbedding(newsRefinedTexts)
              //   : [];
              //
              // newsEmbeddings.forEach((embedding: number[], idx: number) => {
              //   const target =
              //     allProcessedNews[
              //       allProcessedNews.length - newsChunk.length + idx
              //     ];
              //   if (target) target.embedding = embedding; // ✅ guard
              // });
              // --- END EMBEDDINGS DISABLED ---

              // ✅ Store news parallel
              const newsStorePromises: Promise<void>[] = allProcessedNews
                .slice(-newsChunk.length)
                .map(
                  async ({
                    processed,
                    embedding, // (unused)
                  }: NewsProcessedItem): Promise<void> => {
                    // Only store to BigQuery
                    await this.storageSvc.storeNewsToBigQuery(processed);

                    // --- EMBEDDINGS DISABLED ---
                    // await Promise.all([
                    //   this.storageSvc.storeNewsToBigQuery(processed),
                    //   this.storageSvc.storeEmbeddingToVectorDB(
                    //     processed.newsId,
                    //     `${processed.title ?? ""} ${processed.description ?? ""}`,
                    //     embedding,
                    //     "news",
                    //     processed.newsId
                    //   ),
                    // ]);
                    // --- END EMBEDDINGS DISABLED ---
                  }
                );

              await Promise.all(newsStorePromises);

              // ✅ Chunk delay
              if (newsChunkStart + CHUNK_SIZE < standardizedNewsList.length) {
                console.log(
                  `  Delaying ${DELAY_BETWEEN_CHUNKS_MS / 1000}s after news chunk...`
                );
                await new Promise<void>((resolve) =>
                  setTimeout(resolve, DELAY_BETWEEN_CHUNKS_MS)
                );
              }
            }

            // Firestore write for news (unchanged)
            await this.storageSvc.overwriteFirestoreNews(
              career.id,
              allProcessedNews.map((p: NewsProcessedItem) => p.processed)
            );
            let careerNewsCount: number = allProcessedNews.length;

            return { jobCount: careerJobCount, newsCount: careerNewsCount };
          }
        );

        // Wait for the batch (here batch size 1 so effectively serial)
        const batchResults: CareerCounts[] = await Promise.all(batchPromises);

        for (const result of batchResults) {
          totalJobs += result.jobCount;
          totalNews += result.newsCount;
        }

        console.log(
          `Finished batch. Current Totals: ${totalJobs} jobs, ${totalNews} news`
        );

        // Delay between career batches (if not last)
        if (careerBatches.indexOf(batch) < careerBatches.length - 1) {
          console.log(
            `Delaying ${DELAY_BETWEEN_CHUNKS_MS / 1000}s between career batches...`
          );
          await new Promise<void>((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_CHUNKS_MS)
          );
        }
      }

      // Success
      return {
        success: true,
        data: { processedJobs: totalJobs, processedNews: totalNews },
      };
    } catch (error: unknown) {
      console.error("Ingestion Error:", error);
      return {
        success: false,
        error: "Ingestion failed due to an unexpected error",
      };
    }
  }

  // These manual methods are fine as-is
  async manualAddToBigQuery(jobData: Partial<StandardizedJob>): Promise<void> {
    await this.storageSvc.manualAddJob(jobData);
  }

  async manualAddToVectorDB(text: string, sourceId?: string): Promise<void> {
    // --- EMBEDDINGS DISABLED ---
    console.warn(`manualAddToVectorDB is disabled. Call to manualAddText skipped.`);
    // await this.storageSvc.manualAddText(text, sourceId);
    // --- END EMBEDDINGS DISABLED ---
  }
}