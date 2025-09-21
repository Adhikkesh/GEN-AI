import axios from 'axios';
import { config } from '../config';

export interface Job {
  jobId: string | number; 
  jobTitle: string;
  companyName: string;
  location: string;
  jobBoardUrl: string;
  dateCreation: string;
}

class JobService {
  private readonly THEIR_STACK_API_URL = 'https://api.theirstack.com/v1/jobs/search';

  public async findJobPostings(careerTitle: string, skills: string[]): Promise<Job[]> {
    const apiKey = config.theirStack.apiKey;
    if (!apiKey) {
      console.error('TheirStack API key is not configured.');
      return [];
    }

    const titleKeywords = [
        careerTitle,
        "AI Engineer",
        "Machine Learning Engineer",
        "ML Engineer"
    ];

    const descriptionKeywords = skills.slice(0, 3);

    const requestBody = {
      page: 0,
      limit: 15,
      posted_at_max_age_days: 30,
      job_country_code_or: ["IN"], 
      job_title_or: titleKeywords, 
      job_description_contains_or: descriptionKeywords, 
    };

    try {
      const response = await axios.post(this.THEIR_STACK_API_URL, requestBody, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const allJobs: Job[] = [];
      if (response.data && response.data.data) {
        response.data.data.forEach((job: any) => {
          allJobs.push({
            jobId: job.id,
            jobTitle: job.job_title,
            companyName: job.company_object?.name || 'N/A',
            location: job.locations?.[0]?.name || 'N/A',
            jobBoardUrl: job.url,
            dateCreation: job.date_posted,
          });
        });
      }
      
      console.log(`Found ${allJobs.length} relevant job postings from TheirStack.`);
      return allJobs;

    } catch (error: any) {
      console.error('Error fetching job postings from TheirStack API:', error.response?.data || error.message);
      return [];
    }
  }
}

export const jobService = new JobService();