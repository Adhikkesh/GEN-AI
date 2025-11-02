import { VertexAI } from '@google-cloud/vertexai';

// --- CONFIG ---
const PROJECT_ID = 'rock-idiom-475618-q4';
const REGION = 'us-central1';
const MODEL_ID = 'gemini-2.5-flash-lite';
// ---------------

const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: REGION,
});

const model = vertexAI.getGenerativeModel({
  model: MODEL_ID,
});

async function runTest() {
  console.log(`🚀 Sending request to model: ${MODEL_ID} in ${REGION}...`);

  try {
    const request = {
      contents: [
        { role: 'user', parts: [{ text: 'Write a hello world function in Python' }] },
      ],
    };

    const response = await model.generateContent(request);

    // ✅ Type-safe extraction
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
    console.log('✅ Model Response:\n', text);
  } catch (err) {
    console.error('❌ Gemini Request Error:', err);
  }
}

runTest();
