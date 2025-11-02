// services/news-fetch.service.ts
import { ExternalApiClient } from '../clients/externalAPI';
// FIX: Import ApiResponse from common.types, not news.types
import { ApiResponse } from '../types/common.types';
import { RawNews, StandardizedNews } from '../types/news.types';

export class NewsFetchService {
  private client = new ExternalApiClient();

  async fetchNewsForCareer(careerQuery: string): Promise<ApiResponse<StandardizedNews[]>> {
    try {
      // Assuming client.fetchNews returns ApiResponse<RawNews[]>
      const res = await this.client.fetchNews(careerQuery);
      if (!res.success) return { success: false, error: res.error };

      const news: StandardizedNews[] = (res.data ?? []).map((article: RawNews) =>
        // Pass a name for the API source you are using
        this.normalizeNews(article, careerQuery, 'GoogleNews')
      );

      return { success: true, data: news.slice(0, 10) }; // Limit to 10
    } catch (error) {
      console.error('NewsFetch Error:', error);
      return { success: false, error: 'Failed to fetch news' };
    }
  }

  /**
   * Corrected function to match your exact RawNews and StandardizedNews types.
   */
  private normalizeNews(article: RawNews, searchQuery: string, ingestionSource: string): StandardizedNews {
    const newsId = this.generateNewsId(article);
    const publishedAt = this.parseRelativeDate(article.date);
    const category = this.extractCategory(article.title, article.snippet);
    const ingestedAtISO = new Date().toISOString();

    return {
      // --- Data from RawNews ---
      newsId: newsId,
      title: article.title,
      description: article.snippet, // Maps to snippet
      source: article.source,
      url: article.link,            // Maps to link
      thumbnail: article.thumbnail,
      position: article.position,

      // --- Generated/Passed Data ---
      category: category,
      search_query: searchQuery,
      published_at: publishedAt.toISOString(),
      ingested_at: ingestedAtISO,
      ingestion_source: ingestionSource, // e.g., 'GoogleNews'

      // --- Hardcoded Defaults (not available in RawNews) ---
      language: 'en', // Default language
      is_active: true,
      updated_at: ingestedAtISO, // Set to ingested_at on creation

      // --- Raw Data (using only fields from RawNews) ---
      raw_data: {
        date_text: article.date,
        position: article.position,
        // This field is not in your RawNews type, so set to 'N/A'
        search_metadata_id: 'N/A',
      },
    };
  }

  private generateNewsId(article: RawNews): string {
    // The article link is usually the most stable unique identifier
    const baseString = article.link || `${article.title}-${article.source}-${article.date}`;
    return Buffer.from(baseString).toString('base64').slice(0, 64).replace(/[^a-zA-Z0-9]/g, '');
  }

  private parseRelativeDate(dateString: string): Date {
    const now = new Date();

    if (!dateString) return now;

    const lowerDate = dateString.toLowerCase();

    if (lowerDate.includes('hour')) {
      const hours = parseInt(dateString) || 0;
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    }

    if (lowerDate.includes('day')) {
      const days = parseInt(dateString) || 0;
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    if (lowerDate.includes('week')) {
      const weeks = parseInt(dateString) || 0;
      return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
    }

    if (lowerDate.includes('month')) {
      const months = parseInt(dateString) || 0;
      return new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);
    }

    return now;
  }

  private extractCategory(title: string, snippet: string): string {
    const text = (title + ' ' + snippet).toLowerCase();

    if (text.includes('career') || text.includes('job') || text.includes('hiring')) return 'career';
    if (text.includes('ai') || text.includes('artificial intelligence')) return 'ai';
    if (text.includes('machine learning') || text.includes('ml')) return 'machine-learning';
    if (text.includes('backend') || text.includes('software engineer')) return 'backend';
    if (text.includes('certification') || text.includes('certificate')) return 'certification';
    if (text.includes('skill') || text.includes('training')) return 'skills';

    return 'general';
  }
}