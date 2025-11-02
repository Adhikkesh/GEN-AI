// test-embedding.js
import { GoogleAuth } from 'google-auth-library';

const PROJECT = 'rock-idiom-475618-q4';
const LOCATION = 'us-central1';
const MODEL = 'text-embedding-004';

async function run() {
  try {
    const input = 'Generative AI is transforming technology.';
    
    // Initialize Google Auth
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    
    // Prepare the request
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;
    
    const requestBody = {
      instances: [
        {
          content: input,
          task_type: 'RETRIEVAL_DOCUMENT' // Options: RETRIEVAL_DOCUMENT, RETRIEVAL_QUERY, SEMANTIC_SIMILARITY, CLASSIFICATION, CLUSTERING
        }
      ]
    };

    // Make the request
    const response = await client.request({
      url: url,
      method: 'POST',
      data: requestBody
    });

    console.log('✅ Embedding response:', JSON.stringify(response.data, null, 2));

    // Access the embedding values
    if (response.data.predictions && response.data.predictions.length > 0) {
      const embedding = response.data.predictions[0].embeddings;
      const vector = embedding.values || [];
      console.log('🧠 Vector length:', vector.length);
      console.log('🔹 First 10 values:', vector.slice(0, 10));
    }
  } catch (err) {
    console.error('❌ Embedding error:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
}

run();