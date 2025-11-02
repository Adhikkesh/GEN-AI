// insert-embedding.js
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { helpers } from '@google-cloud/aiplatform';  // <-- Add this import
import { Client } from 'pg';

const GEMINI_PROJECT_ID = 'rock-idiom-475618-q4';
const GEMINI_LOCATION = 'us-central1';
const PG_CONNECTION = 'postgresql://postgres:SKAR2005!s@127.0.0.1:5432/genai_db'; // Cloud SQL proxy

async function getEmbedding(text) {
  const client = new PredictionServiceClient({
    apiEndpoint: `${GEMINI_LOCATION}-aiplatform.googleapis.com`,
  });
  const endpoint = `projects/${GEMINI_PROJECT_ID}/locations/${GEMINI_LOCATION}/publishers/google/models/text-embedding-004`;
  
  // Wrap the instance in helpers.toValue() to create a proper protobuf StructValue
  const instances = [
    helpers.toValue({
      content: text,
      task_type: "RETRIEVAL_DOCUMENT"
    })
  ];
  
  const [response] = await client.predict({
    endpoint,
    instances,
  });
  
  const values =
    response?.predictions?.[0]?.structValue?.fields?.embeddings?.structValue?.fields?.values?.listValue?.values;
  if (!values || values.length === 0) {
    throw new Error('Empty embedding returned.');
  }
  return values.map((v) => v.numberValue ?? 0);
}

async function insertEmbedding({ source_id, content_type, text }) {
  const pgClient = new Client({
    connectionString: PG_CONNECTION,
    ssl: false,
  });
  await pgClient.connect();
  const embedding = await getEmbedding(text);
  const query = `
    INSERT INTO embeddings (id, source_id, content_type, text_to_show, embedding, created_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, NOW())
    ON CONFLICT (source_id, content_type) DO UPDATE SET
      text_to_show = EXCLUDED.text_to_show,
      embedding = EXCLUDED.embedding,
      updated_at = NOW()
    RETURNING id;
  `;
  const result = await pgClient.query(query, [
    source_id,
    content_type,
    text,
    `[${embedding.join(',')}]`,
  ]);
  console.log(`✅ Inserted embedding for "${source_id}" — row ID: ${result.rows[0].id}`);
  await pgClient.end();
}

// Example run
(async () => {
  const text = 'Generative AI enables smarter, more adaptive applications across industries.';
  await insertEmbedding({
    source_id: 'news003',
    content_type: 'news',
    text,
  });
})();