// Import Vertex AI SDK
import { VertexAI } from '@google-cloud/vertexai';

// --- CONFIG ---
const PROJECT_ID = 'rock-idiom-475618-q4';
const REGION = 'us-central1';
const MODEL_ID = 'gemini-2.0-flash-lite';
// ---------------

// Initialize Vertex AI client
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: REGION,
});

// Get the generative model
const model = vertexAI.getGenerativeModel({
  model: MODEL_ID,
});

async function runTest() {
  console.log(`🚀 Sending request to model: ${MODEL_ID} in ${REGION}...`);

  try {
    const request = {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Write a hello world function in Python' }],
        },
      ],
    };

    const response = await model.generateContent(request);

    // Extract safely
    const candidates = response.response?.candidates;
    if (!candidates || candidates.length === 0) {
      console.error('⚠️ No candidates returned from model');
      return;
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      console.error('⚠️ No content parts in candidate');
      return;
    }

    const text = parts[0].text || '(No text returned)';
    console.log('✅ Model Response:\n');
    console.log(text);

  } catch (err) {
    console.error('❌ Gemini Request Error:', err);
  }
}

runTest();
