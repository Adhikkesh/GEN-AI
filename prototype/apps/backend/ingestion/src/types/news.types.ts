export interface RawNews {
  position: number;
  title: string;
  link: string;
  source: string;
  thumbnail?: string;
  snippet: string;
  date: string;
}

export interface StandardizedNews {
  newsId: string;
  title: string;
  description: string;  // Maps to snippet
  source: string;
  url: string;  // Maps to link
  category: string;
  search_query: string;
  language: string;
  thumbnail?: string;
  published_at: Date | string;  // ISO string or Date; aligns with Timestamp.fromDate
  ingested_at: string;  // ISO string for consistency
  updated_at: string;  // ISO string for consistency
  position: number;
  ingestion_source: string;
  is_active: boolean;
  raw_data: {
    date_text: string;
    position: number;
    search_metadata_id: string;
  };
}

export interface ProcessedNewsResult {
  processed: StandardizedNews;
  embedding: number[];
}