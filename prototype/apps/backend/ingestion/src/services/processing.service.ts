// src/services/processing.service.ts

import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';
import { env } from '../utils/env';
import { RawNews, StandardizedNews, ProcessedNewsResult } from '../types/news.types';
import { ProcessedJobs, StandardizedJob } from '../types/job.types';
import pRetry from 'p-retry';  // npm i p-retry

export class ProcessingService {
  private vertexAI: VertexAI;
  private refinementModel: GenerativeModel;
  private auth: GoogleAuth;
  private embeddingEndpoint: string;

  constructor() {
    this.vertexAI = new VertexAI({
      project: env.GEMINI_PROJECT_ID,
      location: env.GEMINI_LOCATION,
    });
    this.refinementModel = this.vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
    });

    this.auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    this.embeddingEndpoint = `https://${env.GEMINI_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.GEMINI_PROJECT_ID}/locations/${env.GEMINI_LOCATION}/publishers/google/models/text-embedding-004:predict`;
  }

  async refineWithGemini(
    text: string,
    type: 'job' | 'news'
  ): Promise<{ cleaned_title: string; cleaned_description: string; skills_list: string[] }> {
    const prompt: string = `Extract structured data from this ${type} posting:
        ${text}
        Respond ONLY with valid JSON matching this exact schema: {
          "cleaned_title": "Cleaned and concise ${type} title",
          "cleaned_description": "A cleaned, professional, and concise description, formatted as a single paragraph of text with no markdown. (200 words max)",
          "skills_list": ["skill1", "skill2", "skill3"]
        }
        If the input is not a ${type} posting, return: {
          "cleaned_title": "N/A",
          "cleaned_description": "N/A",
          "skills_list": []
        }`;
  
    // Retry wrapper for 429 quota errors
    const result = await pRetry(async () => {
      const genResult = await this.refinementModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 500,
        },
      });
  
      const candidate = genResult.response.candidates?.[0];
      const content = candidate?.content;
      const parts = content?.parts;
      const responseText = parts?.[0]?.text;
      if (!responseText) {
        throw new Error('No content in Gemini response');
      }
  
      const extracted = JSON.parse(responseText);
      return {
        cleaned_title: extracted.cleaned_title || '',
        cleaned_description: extracted.cleaned_description || '',
        skills_list: extracted.skills_list || [],
      };
    }, {
      retries: 3,
      minTimeout: 1000,  // 1s initial
      factor: 2,         // 1s, 2s, 4s
      onFailedAttempt: (error: any) => {
        if (error.code === 429 || error.status === 'RESOURCE_EXHAUSTED') {
          console.warn(`Refinement retry for ${type} (quota): ${error.message}`);
        }
      }
    });
  
    return result;
  }

  // Updated: Now batches multiple texts (up to 5 per request)
  async getEmbedding(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    // Optional: Skip very short texts to save quota
    const validTexts = texts.filter(t => t && t.length >= 50);
    if (validTexts.length < texts.length) {
      console.log(`Skipped ${texts.length - validTexts.length} short texts`);
    }
    if (validTexts.length === 0) return texts.map(() => new Array(768).fill(0));

    try {
      const client = await this.auth.getClient();

      // Split into batches of 5
      const batches: string[][] = [];
      for (let i = 0; i < validTexts.length; i += 5) {
        batches.push(validTexts.slice(i, i + 5));
      }

      const allEmbeddings: number[][] = [];
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        if (!batch) continue;
        const requestBody = {
          instances: batch.map(text => ({
            content: text,
            task_type: 'RETRIEVAL_DOCUMENT'
          }))
        };

        // Retry on 429 with backoff
        const response = await pRetry(async () => {
          return client.request({
            url: this.embeddingEndpoint,
            method: 'POST',
            data: requestBody
          }) as { data?: { predictions?: Array<{ embeddings?: { values?: number[] } }> } };
        }, {
          retries: 3,
          minTimeout: 1000,  // Start at 1s
          factor: 2,         // 1s, 2s, 4s
          onFailedAttempt: (error: { code?: number }) => {
            if (error.code === 429) {
              console.warn(`Retry batch ${batchIndex + 1}/${batches.length} (quota): ${batch.length} items`);
            }
          }
        });

        if (response.data?.predictions) {
          response.data.predictions.forEach((pred: { embeddings?: { values?: number[] } }) => {
            const vector = pred.embeddings?.values || new Array(768).fill(0);
            allEmbeddings.push(vector);
          });
        } else {
          // Fallback for this batch
          batch.forEach(() => allEmbeddings.push(new Array(768).fill(0)));
        }

        // Throttle: Delay between batches (except last)
        if (batchIndex < batches.length - 1) {
          console.log(`Processed batch ${batchIndex + 1}/${batches.length} (${batch.length} items)`);
          await new Promise(resolve => setTimeout(resolve, 500));  // 0.5s delay
        }
      }

      // Pad with zeros if we skipped shorts
      while (allEmbeddings.length < texts.length) {
        allEmbeddings.push(new Array(768).fill(0));
      }
      return allEmbeddings;
    } catch (error: any) {
      console.error('Batch embedding failed:', error.message);
      if (error.response) console.error('Response:', error.response.data);
      return texts.map(() => new Array(768).fill(0));  // Graceful fallback
    }
  }

  // Updated: Use single-text batch
  async processJob(job: StandardizedJob): Promise<{ processed: StandardizedJob; embedding: number[] }> {
    const { cleaned_title, cleaned_description, skills_list } =
      await this.refineWithGemini(`${job.raw_title} ${job.raw_description}`, 'job');
    
    const embeddings = await this.getEmbedding([
      `${cleaned_title} ${cleaned_description} ${skills_list.join(' ')}`
    ]);

    return {
      processed: {
        ...job,
        cleaned_title: cleaned_title || job.raw_title,
        cleaned_description: cleaned_description || job.raw_description,
        skills_list,
      },
      embedding: embeddings[0] || new Array(768).fill(0),
    };
  }

  // Updated: Use single-text batch
  async processNews(newsItem: StandardizedNews): Promise<ProcessedNewsResult> {
    const { cleaned_title, cleaned_description, skills_list: _ } =
      await this.refineWithGemini(`${newsItem.title} ${newsItem.description}`, 'news');
    
    const embeddings = await this.getEmbedding([`${cleaned_title} ${cleaned_description}`]);

    const processed: StandardizedNews = {
      ...newsItem,
      title: cleaned_title || newsItem.title,
      description: cleaned_description || newsItem.description,
    };
    return { processed, embedding: embeddings[0] || new Array(768).fill(0) };
  }
}