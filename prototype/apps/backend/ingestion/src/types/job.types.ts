// Standardized Job type (from your plan)
export interface RawJob {
  // SerpApi or JSearch raw fields (union based on source)
  title?: string;
  job_title?: string;
  company_name?: string;
  employer_name?: string;
  description?: string;
  job_description?: string;
  job_id?: string;
  source_job_id?: string;
  apply_link?: string;
  job_apply_link?: string;
  via?: string;
  job_publisher?: string;
  extensions?: string[];  // e.g., ["1 day ago", "Full-time"]
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    work_from_home?: boolean;
  };
  job_is_remote?: boolean;
  job_posted_at?: string;  // e.g., "1 day ago"
  job_posted_at_datetime_utc?: string;  // ISO string
  location?: string;
  job_location?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  salary?: string;  // Optional salary text
}

export interface StandardizedJob {
  source_job_id: string;
  ingestion_source: 'SerpApi' | 'JSearch';
  career_query: string;

  // Raw
  raw_title: string;
  raw_description: string;
  raw_company_name: string;

  // Refined (from Gemini)
  cleaned_title: string | null;
  cleaned_description: string | null;
  skills_list: string[];
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | null;
  salary_text: string | null;
  is_remote: boolean;

  // Metadata
  location_text: string;
  city: string | null;
  state: string | null;
  country_code: string;
  apply_link: string | null;
  source_platform: string;
  posted_at: string | null;  // ISO timestamp
  ingested_at: string;  // ISO timestamp,
  embedding: number[]
}

export interface ProcessedJobs extends StandardizedJob {
  embedding: number[]
}

export interface JobFetchResponse {
  serpapi: RawJob[];
  jsearch: RawJob[];
}