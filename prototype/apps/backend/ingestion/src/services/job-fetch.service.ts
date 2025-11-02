// Service to fetch jobs from external APIs
import { ExternalApiClient } from '../clients/externalAPI';
import { RawJob, JobFetchResponse, StandardizedJob } from '../types/job.types';
import { ApiResponse, PaginationParams } from '../types/common.types';
import { parsePostedAt } from '../utils/date-parser';

export class JobFetchService {
  private client = new ExternalApiClient();
  private defaultParams: PaginationParams = {
    page: 1,
    num_pages: 1,
    date_posted: 'today',
    country: 'in',
    language: 'en',
  };

  async fetchJobsForCareer(careerQuery: string): Promise<ApiResponse<JobFetchResponse>> {
    try {
      // Fetch 20 from SerpApi
      const serpRes = await this.client.fetchJobsSerpApi(careerQuery, {
        ...this.defaultParams,
        num_pages: 1,  // ~20 jobs
      });
      let serpJobs: RawJob[] = [];
      if (serpRes.success) {
        serpJobs = (serpRes.data ?? []).map(job => ({
          ...job,
          job_id: job.job_id || `serp-${Date.now()}-${Math.random()}`,
          job_posted_at: job.detected_extensions?.posted_at || 'Unknown',
        }));
      }

      // Fetch 20 from JSearch
      const jsearchRes = await this.client.fetchJobsJSearch(careerQuery, this.defaultParams);
      let jsearchJobs: RawJob[] = [];
      if (jsearchRes.success) {
        jsearchJobs = (jsearchRes.data ?? []).map(job => ({
          ...job,
          title: job.job_title,
          company_name: job.employer_name,
          description: job.job_description,
          apply_link: job.job_apply_link,
          via: job.job_publisher,
          job_posted_at: job.job_posted_at,
        }));
      }

      // Normalize posted_at for SerpApi
      serpJobs.forEach(job => {
        job.job_posted_at_datetime_utc = parsePostedAt(job.job_posted_at) || undefined;
      });

      return {
        success: true,
        data: { serpapi: serpJobs, jsearch: jsearchJobs },
      };
    } catch (error) {
      console.error('JobFetch Error:', error);
      return { success: false, error: 'Failed to fetch jobs' };
    }
  }

  // Normalize raw jobs to StandardizedJob
  normalizeJob(rawJob: RawJob, source: 'SerpApi' | 'JSearch', careerQuery: string): StandardizedJob {
    const now = new Date().toISOString();
    return {
      source_job_id: rawJob.job_id || rawJob.source_job_id || `${source}-${Date.now()}`,
      ingestion_source: source,
      career_query: careerQuery,
      raw_title: rawJob.title || rawJob.job_title || 'Unknown Title',
      raw_description: rawJob.description || rawJob.job_description || 'No description',
      raw_company_name: rawJob.company_name || rawJob.employer_name || 'Unknown Company',
      cleaned_title: null,
      cleaned_description: null,
      skills_list: [],
      employment_type: null,
      salary_text: rawJob.salary || null,
      is_remote: rawJob.job_is_remote || rawJob.detected_extensions?.work_from_home || false,
      location_text: rawJob.location || rawJob.job_location || 'India',
      city: rawJob.job_city || null,
      state: rawJob.job_state || null,
      country_code: rawJob.job_country || 'IN',
      apply_link: rawJob.apply_link || rawJob.job_apply_link || null,
      source_platform: rawJob.via || rawJob.job_publisher || 'Unknown',
      posted_at: rawJob.job_posted_at_datetime_utc || null,
      ingested_at: now,
      embedding: [], 
    };
  }
}