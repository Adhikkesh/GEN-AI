// Common shared types for ingestion service
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  num_pages?: number;
  date_posted?: 'today' | 'past_24h' | 'all';
  country?: string;
  language?: string;
}

export interface GeminiPrompt {
  text: string;
  model?: string;
}