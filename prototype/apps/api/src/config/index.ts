import dotenv from 'dotenv';
dotenv.config();

export const config = {
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    location: process.env.GCP_LOCATION,
  },
  vertexAI: {
    indexEndpointId: process.env.INDEX_ENDPOINT_ID,
    deployedIndexId: process.env.DEPLOYED_INDEX_ID,
  }
};