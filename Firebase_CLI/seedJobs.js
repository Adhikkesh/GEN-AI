import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// 1️⃣ Initialize Firebase
initializeApp({
  credential: cert("./serviceAccountKey.json"),
});

const db = getFirestore();

// 2️⃣ Read jobs.json
const jobs = JSON.parse(readFileSync("./jobs.json", "utf8"));

// 3️⃣ Upload jobs to Firestore
async function uploadJobs() {
  for (const job of jobs) {
    // Derive the career ID from title or keyword
    const careerId = job.job_title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Reference: /career_jobs/[careerId]/listings/[job_id]
    const jobRef = db
      .collection("career_jobs")
      .doc(careerId)
      .collection("listings")
      .doc(job.job_id);

    const standardizedJob = {
      source_job_id: job.job_id,
      ingestion_source: "JSearch",
      career_query: careerId.replace(/-/g, " "),
      raw_title: job.job_title,
      raw_description: job.job_description,
      raw_company_name: job.employer_name,

      cleaned_title: null,
      cleaned_description: null,
      skills_list: [],
      employment_type: job.job_employment_type || null,
      salary_text: job.job_min_salary
        ? `₹${job.job_min_salary.toLocaleString()} per month`
        : null,
      is_remote: job.job_is_remote || false,

      location_text: job.job_location || "Unknown",
      city: job.job_city || null,
      state: job.job_state || null,
      country_code: job.job_country || "IN",
      apply_link:
        job.job_apply_link ||
        (job.apply_options && job.apply_options[0]?.apply_link) ||
        null,
      source_platform: job.job_publisher || "Unknown",
      posted_at: job.job_posted_at_datetime_utc || null,
      ingested_at: new Date().toISOString(),
    };

    await jobRef.set(standardizedJob);
    console.log(`✅ Added job: ${job.job_title} → career_jobs/${careerId}/listings/${job.job_id}`);
  }

  console.log("🎯 All jobs uploaded successfully!");
}

uploadJobs().catch(console.error);
