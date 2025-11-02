// External API clients (SerpApi, JSearch, NewsAPI)
import axios from 'axios';
import { env } from '../utils/env';
import { RawJob } from '../types/job.types';
import { RawNews } from '../types/news.types';
import { PaginationParams, ApiResponse } from '../types/common.types';

export class ExternalApiClient {
  private serpapiBase = 'https://serpapi.com/search.json';
  private jsearchBase = 'https://jsearch.p.rapidapi.com/search';
  private baseUrl = 'https://serpapi.com/search';
  private apiKey = process.env.SERPAPI_KEY;

  async fetchJobsSerpApi(query: string, params: PaginationParams): Promise<ApiResponse<RawJob[]>> {
    try {
      const response = await axios.get(this.serpapiBase, {
        params: {
          engine: 'google_jobs',
          q: query,
          location: 'India',
          gl: 'in',
          hl: 'en',
          date_posted: params.date_posted || 'today',
          api_key: env.SERPAPI_KEY,
          ...params,
        },
      });
      return { success: true, data: response.data.jobs_results || [] };
    } catch (error) {
      console.error('SerpApi Error:', error);
      return { success: false, error: 'Failed to fetch SerpApi jobs' };
    }
  }

  async fetchJobsJSearch(query: string, params: PaginationParams): Promise<ApiResponse<RawJob[]>> {
    try {
      const response = await axios.get(this.jsearchBase, {
        headers: {
          'X-Rapidapi-Key': env.JSEARCH_KEY,
          'X-Rapidapi-Host': 'jsearch.p.rapidapi.com',
        },
        params: {
          query,
          page: params.page || 1,
          num_pages: params.num_pages || 1,
          date_posted: params.date_posted || 'today',
          country: params.country || 'in',
          language: params.language || 'en',
        },
      });
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('JSearch Error:', error);
      return { success: false, error: 'Failed to fetch JSearch jobs' };
    }
  }

  async fetchNews(query: string, params: PaginationParams = {}): Promise<ApiResponse<RawNews[]>> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'google_news_light',
          q: query,
          api_key: this.apiKey,
          tbs: 'qdr:d',
          num: 10,
          ...params,
        },
      });

      if (!response.data.news_results) {
        return { success: true, data: [] };
      }

      return { 
        success: true, 
        data: response.data.news_results as RawNews[] 
      };
    } catch (error) {
      console.error('SerpAPI Error:', error);
      return { 
        success: false, 
        error: 'Failed to fetch news from SerpAPI' 
      };
    }
  }
}