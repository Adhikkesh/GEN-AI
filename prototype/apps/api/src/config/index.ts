require('dotenv/config');

export const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || 'your-gcp-project-id',
    location: process.env.GCP_REGION || 'us-central1',
  },
  
  vertexAI: {
    location: process.env.VERTEX_AI_LOCATION || 'us-central1',
    indexEndpointId: process.env.VERTEX_AI_INDEX_ENDPOINT_ID,
    deployedIndexId: process.env.VERTEX_AI_DEPLOYED_INDEX_ID,
  },
  
  firestore: {
    databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)',
  },
  
  auth: {
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  theirStack: { 
    apiKey: process.env.THEIR_STACK_API_KEY,
  },

};

if (config.nodeEnv === 'development') {
  console.log(' Configuration loaded:');
  console.log(`   Project ID: ${config.gcp.projectId}`);
  console.log(`   Location: ${config.gcp.location}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
}