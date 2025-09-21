import { config } from '../config';
import * as admin from 'firebase-admin';
import { VertexAI } from '@google-cloud/vertexai';
import { MatchServiceClient, PredictionServiceClient, IndexEndpointServiceClient, helpers, protos } from '@google-cloud/aiplatform'; // Updated import
import { CareerAnalysis } from '../data/ai.types';
import { getDb } from '../config/firebase';

const getVertexAIClient = () => {
  const clientOptions: any = {
    project: config.gcp.projectId!,
    location: config.gcp.location!,
  };

  if (process.env.NODE_ENV === 'production' || process.env.GOOGLE_CLOUD_PROJECT) {
    console.log("Using Application Default Credentials for Vertex AI...");
  } else if (config.auth.credentialsPath) {
    console.log("Using service account credentials for Vertex AI...");
    clientOptions.keyFilename = config.auth.credentialsPath;
  }

  return new VertexAI(clientOptions);
};

const vertexAI = getVertexAIClient();

const generativeModel = vertexAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
});

const getClientOptions = () => {
  const clientOptions: any = {
    apiEndpoint: `${config.gcp.location}-aiplatform.googleapis.com`,
  };

  if (process.env.NODE_ENV !== 'production' && config.auth.credentialsPath) {
    clientOptions.keyFilename = config.auth.credentialsPath;
  }

  return clientOptions;
};

const predictionServiceClient = new PredictionServiceClient(getClientOptions());
const indexEndpointClient = new IndexEndpointServiceClient(getClientOptions());

class AIService {
  private async retrieveRelevantDocuments(query: string): Promise<string[]> {
    console.log('Querying Vector DB for IDs:', query);
    const db = await getDb();
    const project = config.gcp.projectId;
    const location = config.gcp.location;
    const model = 'text-embedding-004';
    const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${model}`;

    const instance: protos.google.protobuf.IValue = {
      structValue: {
        fields: {
          content: { stringValue: query },
          task_type: { stringValue: 'RETRIEVAL_QUERY' },
        },
      },
    };

    const instances: protos.google.protobuf.IValue[] = [instance];

    const parameters: protos.google.protobuf.IValue = {
      structValue: {
        fields: {}, 
      },
    };

    const request: protos.google.cloud.aiplatform.v1.IPredictRequest = {
      endpoint,
      instances,
      parameters,
    };

    const [response] = await predictionServiceClient.predict(request);

    const predictions = response.predictions;
    if (!predictions || predictions.length === 0) {
      console.error('Could not generate an embedding for the query.');
      return [];
    }

    const prediction = predictions[0];
    if (!prediction) {
      console.error('Prediction is undefined');
      return [];
    }
    
    const structValue = prediction.structValue;
    if (!structValue) {
      console.error('Struct value not found in prediction.');
      return [];
    }

    const embeddingsField = structValue.fields?.embeddings;
    if (!embeddingsField) {
      console.error('Embeddings field not found.');
      return [];
    }

    const embeddingsStruct = embeddingsField.structValue;
    if (!embeddingsStruct) {
      console.error('Embeddings struct not found.');
      return [];
    }

    const valuesField = embeddingsStruct.fields?.values;
    if (!valuesField) {
      console.error('Values field not found.');
      return [];
    }

    const listValue = valuesField.listValue;
    if (!listValue) {
      console.error('List value not found.');
      return [];
    }

    const values = listValue.values ?? [];
    const featureVector = values.map((v) => v.numberValue ?? 0);

    if (featureVector.length === 0) {
      console.error('Could not generate an embedding for the query.');
      return [];
    }

    const indexEndpointName = `projects/${config.gcp.projectId}/locations/${config.gcp.location}/indexEndpoints/${config.vertexAI.indexEndpointId}`;
    const [endpointDetails] = await indexEndpointClient.getIndexEndpoint({
      name: indexEndpointName,
    });

    const deployedIndex = endpointDetails.deployedIndexes?.find(
      (d) => d.id === config.vertexAI.deployedIndexId
    );

    if (!deployedIndex) {
      console.error('Deployed index not found in endpoint details.');
      return [];
    }


    const matchGrpcAddress = endpointDetails.publicEndpointDomainName;
    if (!matchGrpcAddress) {
      console.error('No public endpoint found for the deployed index.');
      return [];
    }
    

    const matchServiceClient = new MatchServiceClient({
      apiEndpoint: matchGrpcAddress,
    });

    const [matchResponse] = await matchServiceClient.findNeighbors({
      indexEndpoint: indexEndpointName,
      deployedIndexId: config.vertexAI.deployedIndexId!,
      queries: [{ datapoint: { featureVector }, neighborCount: 5 }],
    });

    const neighborIds =
      matchResponse.nearestNeighbors?.[0]?.neighbors
        ?.map((neighbor: any) => neighbor.datapoint?.datapointId)
        .filter((id: string | undefined): id is string => !!id) || [];

    if (neighborIds.length === 0) {
      console.log('No relevant document IDs found in Vector DB.');
      return [];
    }

    console.log('Found relevant document IDs:', neighborIds);

    const docRefs = neighborIds.map((id: string) =>
      db.collection('knowledge_documents').doc(id)
    );
    const docSnapshots = await db.getAll(...docRefs);

    return docSnapshots
      .map(snap => snap.data()?.text || '')
      .filter(text => text);
  }

  public async generateCareerAnalysis(interests: string[]): Promise<CareerAnalysis> {
    const uniqueInterests = [...new Set(interests)];
    const query = `career path and skills for someone interested in ${uniqueInterests.join(', ')}`;
    const contextDocuments = await this.retrieveRelevantDocuments(query);

    if (contextDocuments.length === 0) {
      throw new Error('Could not retrieve relevant context to generate a career path.');
    }

    const userSkills = ['Basic Programming', 'Communication'];
    const userBackground = 'College Student';

    const prompt = `You are an expert career advisor specializing in guiding students in India. Your task is to generate a comprehensive, personalized career analysis in a single, valid JSON object, based on the user's profile and the provided knowledge base context.

    **Instructions for the AI:**
    1. Analyze and Synthesize: Carefully analyze all details in the user's profile and synthesize them with the information from the Knowledge Base Context.
    2. Identify the Best Path: From the context, select the single best career that aligns with the user's profile.
    3. Create a Roadmap: Structure the career roadmap into actionable stages (Entry, Mid, Senior), detailing the goals and skills for each stage.
    4. Perform a Gap Analysis: In the skill gap analysis, explicitly compare the user's existing skills to the required technical skills and soft skills for the recommended career.
    5. Suggest Resources: Populate learning resources only with courses, certifications, or books that are mentioned in the Knowledge Base Context. If none are mentioned, return empty arrays.

    ---
    **User Profile:**
    - **Interests:** ${uniqueInterests.join(', ')}
    - **Existing Skills:** ${userSkills.join(', ')}
    - **Academic Background:** ${userBackground}
    ---
    **Knowledge Base Context (Use ONLY this information for your response):**
    ${contextDocuments.join('\n---\n')}
    ---

    **Output Format:**
    Your entire response MUST be a single, valid JSON object. Do not include any text, markdown formatting like \`\`\`json, or explanations outside of the JSON structure provided below.

    {
      "recommendedCareer": "string",
      "careerOverview": "string",
      "skillGapAnalysis": {
        "requiredTechnicalSkills": ["string"],
        "requiredSoftSkills": ["string"],
        "userCurrentStrengths": ["string"]
      },
      "careerRoadmap": {
        "entryLevel": { "title": "string", "description": "string", "skillsToAcquire": ["string"] },
        "midLevel": { "title": "string", "description": "string", "skillsToAcquire": ["string"] },
        "seniorLevel": { "title": "string", "description": "string", "skillsToAcquire": ["string"] }
      },
      "learningResources": {
        "courses": ["string"],
        "certifications": ["string"],
        "booksOrArticles": ["string"]
      }
    }`;

    try {
      const result = await generativeModel.generateContent(prompt);
      const rawResponse = result.response.candidates?.[0]?.content?.parts[0]?.text || '{}';
      const cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();

      let parsed: CareerAnalysis;
      try {
        parsed = JSON.parse(cleanedResponse);
      } catch (err) {
        console.error('Invalid JSON response from Gemini:', cleanedResponse);
        throw err;
      }

      return parsed;
    } catch (e) {
      console.error('Error generating or parsing career analysis from Gemini:', e);
      throw new Error('Failed to generate career analysis.');
    }
  }
}

export const aiService = new AIService();