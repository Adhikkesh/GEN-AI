import { config } from '../config';
import { ANSWER_TO_INTERESTS_MAP } from '../data/quiz.data';
import { VertexAI, HarmBlockThreshold, HarmCategory } from '@google-cloud/vertexai';
import { MatchServiceClient, protos } from '@google-cloud/aiplatform';
import { Firestore } from '@google-cloud/firestore';


export interface MindMapNode {
  id: string;
  label: string;
  type: 'career' | 'branch' | 'sub_branch' | 'detail' | 'skill';
}

export interface MindMapEdge {
  from: string;
  to: string;
}

export interface MindMap {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

class AIService {

  public async generateCareerMindMap(answers: Record<string, string>): Promise<MindMap> {
    try {
      console.log('Starting RAG pipeline for quiz analysis...');


      const interestTags = this.inferInterestsFromAnswers(answers);
      console.log('Inferred interest tags:', interestTags);


      const contextDocuments = await this.retrieveContextDocuments(interestTags);
      console.log('Retrieved context documents:', contextDocuments.length);


      const mindMap = await this.generateMindMapWithGemini(interestTags, contextDocuments);

      return mindMap;

    } catch (error) {
      console.error('Error in RAG pipeline:', error);
      return this.generateFallbackMindMap(answers);
    }
  }


  private inferInterestsFromAnswers(answers: Record<string, string>): string[] {
    console.log('Inferring interests from answers...');
    const answerCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    Object.values(answers).forEach(answer => {
      if (answerCounts[answer] !== undefined) {
        answerCounts[answer]++;
      }
    });
    const maxCount = Math.max(...Object.values(answerCounts));
    const dominantAnswers = Object.keys(answerCounts).filter(
      key => answerCounts[key] === maxCount
    );
    const allInterests = new Set<string>();
    dominantAnswers.forEach(answer => {
      const interests = ANSWER_TO_INTERESTS_MAP[answer];
      if (interests) {
        interests.forEach(interest => allInterests.add(interest));
      }
    });
    return Array.from(allInterests);
  }


  private async retrieveContextDocuments(interestTags: string[]): Promise<string[]> {
    console.log('Retrieving context documents for tags:', interestTags);
    const { projectId } = config.gcp;
    const location = config.vertexAI.location || config.gcp.location;
    const indexEndpointId = config.vertexAI.indexEndpointId;
    const deployedIndexId = config.vertexAI.deployedIndexId;

    if (!projectId || !location || !indexEndpointId || !deployedIndexId) {
      console.warn('Missing Matching Engine configuration. Returning empty context.');
      return [];
    }

    try {
      const vertexAI = new VertexAI({ project: projectId, location });
      const embeddingModelName = 'text-embedding-004';

      const interestText = interestTags.join(', ');

      let embedding: number[] | undefined;
      const maybeGetEmbeddingModel = (vertexAI as any).getTextEmbeddingModel;
      if (typeof maybeGetEmbeddingModel === 'function') {
        const embeddingModel = (vertexAI as any).getTextEmbeddingModel(embeddingModelName);
        const embeddingResp = await embeddingModel.embedContent({ content: interestText });
        embedding = embeddingResp?.[0]?.embedding?.values || embeddingResp?.embedding?.values || embeddingResp?.values;
      } else {
        console.warn('getTextEmbeddingModel not available in this SDK version.');
        return [];
      }

      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        console.warn('No embedding returned from Vertex AI.');
        return [];
      }

      const client = new MatchServiceClient({ apiEndpoint: `${location}-aiplatform.googleapis.com` });
      const indexEndpointName = `projects/${projectId}/locations/${location}/indexEndpoints/${indexEndpointId}`;

      const request: protos.google.cloud.aiplatform.v1.FindNeighborsRequest = {
        indexEndpoint: indexEndpointName,
        deployedIndexId,
        queries: [
          {
            datapoint: {
              featureVector: embedding as number[],
            },
            neighborCount: 5,
          },
        ],
      } as unknown as protos.google.cloud.aiplatform.v1.FindNeighborsRequest;

      const [response] = await client.findNeighbors(request);

      const matchedIds: string[] = [];
      const queries = response?.nearestNeighbors || [];
      for (const q of queries) {
        const neighbors = q?.neighbors || [];
        for (const n of neighbors) {
          const id = n?.datapoint?.datapointId;
          if (id) matchedIds.push(String(id));
        }
      }

      if (matchedIds.length === 0) return [];

      try {
        const firestore = new Firestore({ projectId });
        const collection = firestore.collection('career-documents');
        const docRefs = matchedIds.map(id => collection.doc(id));
        const snapshots = await firestore.getAll(...docRefs);
        const matchedTexts = snapshots
          .map(s => (s.exists ? (s.data() as any)?.text || '' : ''))
          .filter(Boolean);
        return matchedTexts;
      } catch (firestoreErr) {
        console.error('Error fetching matched documents from Firestore:', firestoreErr);
        return [];
      }

    } catch (error) {
      console.error('Error querying Matching Engine:', error);
      return [];
    }
  }

  private async generateMindMapWithGemini(interestTags: string[], contextDocuments: string[]): Promise<MindMap> {
    console.log('Generating mind map with Gemini...');

    const { projectId } = config.gcp;
    const location = config.vertexAI.location || config.gcp.location;
    const modelName = 'gemini-1.5-pro-001';

    const prompt = this.constructRAGPrompt(interestTags, contextDocuments);

    try {
      const vertexAI = new VertexAI({ project: projectId, location });
      const generativeModel = vertexAI.getGenerativeModel({ model: modelName });

      const generationConfig = {
        temperature: 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      } as any;

      const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      ];

      const result = await generativeModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig,
        safetySettings,
      });

      const mindMapJson = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!mindMapJson) {
        throw new Error('Empty response from Gemini');
      }

      const parsed = JSON.parse(mindMapJson);
      this.validateMindMap(parsed);
      return parsed as MindMap;

    } catch (error) {
      console.error('Error generating with Gemini:', error);
      const primaryCareer = this.determinePrimaryCareer(interestTags);
      return this.generateStructuredMindMap(primaryCareer, interestTags);
    }
  }

  private extractJsonString(input: string): string {
    const start = input.indexOf('{');
    const end = input.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('No JSON object found in model output');
    }
    return input.slice(start, end + 1);
  }

  private validateMindMap(obj: any): void {
    if (!obj || !Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) {
      throw new Error('Invalid mind map structure');
    }
  }

  private constructRAGPrompt(interestTags: string[], contextDocuments: string[]): string {
    return `
You are an expert career counselor for Indian students. Your task is to generate a personalized career mind map based on the student's interests and the provided context.

**Student's Inferred Interests:**
${interestTags.join(', ')}

**Context Documents (Use ONLY this information for your answer):**
${contextDocuments.map((doc, index) => `Document ${index + 1}: ${doc.trim()}`).join('\n---\n')}

**Instructions:**
Analyze the student's interests and the context to recommend a primary career path. Then, generate a detailed mind map.
Your entire response MUST be a single, valid JSON object that can be parsed directly. Do not include any text before or after the JSON object.
The JSON object must have two keys: "nodes" and "edges".

- The central node (id: "root") should be the primary career path you recommend.
- Create four main branches from the root: "Field Overview", "Skill Roadmap", "Job Opportunities", and "Related Fields".
- Populate each branch with at least 3-4 detailed sub-nodes based on the context.
- For the "Skill Roadmap", create sub-branches for "Foundational", "Intermediate", and "Advanced" skills.

Ensure all node IDs are unique and all edges reference valid node IDs.
    `;
  }

  private determinePrimaryCareer(interestTags: string[]): string {
    if (interestTags.some(tag => ['analytical', 'data-driven'].includes(tag))) {
      return 'Data Scientist';
    }
    if (interestTags.some(tag => ['creative', 'design-focused'].includes(tag))) {
      return 'UI/UX Designer';
    }
    if (interestTags.some(tag => ['leadership', 'strategic'].includes(tag))) {
      return 'Product Manager';
    }
    if (interestTags.some(tag => ['technical', 'problem-solving'].includes(tag))) {
      return 'Software Engineer';
    }
    return 'Full-Stack Developer';
  }

  private generateStructuredMindMap(career: string, interestTags: string[]): MindMap {
    const nodes: MindMapNode[] = [
      { id: "root", label: career, type: "career" },
      { id: "overview", label: "Field Overview", type: "branch" },
      { id: "roadmap", label: "Skill Roadmap", type: "branch" },
      { id: "jobs", label: "Job Opportunities", type: "branch" },
      { id: "related", label: "Related Fields", type: "branch" },
    ];

    const edges: MindMapEdge[] = [
      { from: "root", to: "overview" },
      { from: "root", to: "roadmap" },
      { from: "root", to: "jobs" },
      { from: "root", to: "related" },
    ];

    this.addCareerSpecificNodes(career, nodes, edges, interestTags);
    return { nodes, edges };
  }

  private addCareerSpecificNodes(career: string, nodes: MindMapNode[], edges: MindMapEdge[], interestTags: string[]): void {
    switch (career) {
      case 'Data Scientist':
        this.addDataScienceNodes(nodes, edges);
        break;
      case 'UI/UX Designer':
        this.addDesignNodes(nodes, edges);
        break;
      case 'Product Manager':
        this.addProductManagerNodes(nodes, edges);
        break;
      case 'Software Engineer':
      default:
        this.addSoftwareEngineerNodes(nodes, edges);
        break;
    }
  }

  private addDataScienceNodes(nodes: MindMapNode[], edges: MindMapEdge[]): void {
    nodes.push(
      { id: "overview_1", label: "Analyze data to extract business insights", type: "detail" },
      { id: "overview_2", label: "Build predictive models and algorithms", type: "detail" },
      { id: "overview_3", label: "Work with big data and ML pipelines", type: "detail" }
    );
    edges.push(
      { from: "overview", to: "overview_1" },
      { from: "overview", to: "overview_2" },
      { from: "overview", to: "overview_3" }
    );

    nodes.push(
      { id: "roadmap_foundational", label: "Foundational", type: "sub_branch" },
      { id: "roadmap_intermediate", label: "Intermediate", type: "sub_branch" },
      { id: "roadmap_advanced", label: "Advanced", type: "sub_branch" }
    );
    edges.push(
      { from: "roadmap", to: "roadmap_foundational" },
      { from: "roadmap", to: "roadmap_intermediate" },
      { from: "roadmap", to: "roadmap_advanced" }
    );

    nodes.push(
      { id: "skill_python", label: "Python Programming", type: "skill" },
      { id: "skill_sql", label: "SQL & Databases", type: "skill" },
      { id: "skill_stats", label: "Statistics & Probability", type: "skill" }
    );
    edges.push(
      { from: "roadmap_foundational", to: "skill_python" },
      { from: "roadmap_foundational", to: "skill_sql" },
      { from: "roadmap_foundational", to: "skill_stats" }
    );

    nodes.push(
      { id: "job_1", label: "Data Analyst (₹4-8 LPA)", type: "detail" },
      { id: "job_2", label: "ML Engineer (₹8-15 LPA)", type: "detail" },
      { id: "job_3", label: "Senior Data Scientist (₹15-30 LPA)", type: "detail" }
    );
    edges.push(
      { from: "jobs", to: "job_1" },
      { from: "jobs", to: "job_2" },
      { from: "jobs", to: "job_3" }
    );

    nodes.push(
      { id: "related_1", label: "Business Intelligence", type: "detail" },
      { id: "related_2", label: "AI/ML Engineering", type: "detail" },
      { id: "related_3", label: "Data Engineering", type: "detail" }
    );
    edges.push(
      { from: "related", to: "related_1" },
      { from: "related", to: "related_2" },
      { from: "related", to: "related_3" }
    );
  }

  private addSoftwareEngineerNodes(nodes: MindMapNode[], edges: MindMapEdge[]): void {
    nodes.push(
      { id: "overview_1", label: "Design and develop software applications", type: "detail" },
      { id: "overview_2", label: "Work on web, mobile, or backend systems", type: "detail" },
      { id: "overview_3", label: "Collaborate in agile development teams", type: "detail" }
    );
    edges.push(
      { from: "overview", to: "overview_1" },
      { from: "overview", to: "overview_2" },
      { from: "overview", to: "overview_3" }
    );

    nodes.push(
      { id: "roadmap_foundational", label: "Foundational", type: "sub_branch" },
      { id: "roadmap_intermediate", label: "Intermediate", type: "sub_branch" },
      { id: "roadmap_advanced", label: "Advanced", type: "sub_branch" }
    );
    edges.push(
      { from: "roadmap", to: "roadmap_foundational" },
      { from: "roadmap", to: "roadmap_intermediate" },
      { from: "roadmap", to: "roadmap_advanced" }
    );

    nodes.push(
      { id: "skill_js", label: "JavaScript/TypeScript", type: "skill" },
      { id: "skill_react", label: "React/Node.js", type: "skill" },
      { id: "skill_cloud", label: "Cloud Platforms", type: "skill" }
    );
    edges.push(
      { from: "roadmap_foundational", to: "skill_js" },
      { from: "roadmap_intermediate", to: "skill_react" },
      { from: "roadmap_advanced", to: "skill_cloud" }
    );

    nodes.push(
      { id: "job_1", label: "Frontend Developer (₹3-8 LPA)", type: "detail" },
      { id: "job_2", label: "Full-stack Developer (₹6-15 LPA)", type: "detail" },
      { id: "job_3", label: "Senior Engineer (₹15-40 LPA)", type: "detail" }
    );
    edges.push(
      { from: "jobs", to: "job_1" },
      { from: "jobs", to: "job_2" },
      { from: "jobs", to: "job_3" }
    );

    nodes.push(
      { id: "related_1", label: "DevOps Engineering", type: "detail" },
      { id: "related_2", label: "Mobile Development", type: "detail" },
      { id: "related_3", label: "System Architecture", type: "detail" }
    );
    edges.push(
      { from: "related", to: "related_1" },
      { from: "related", to: "related_2" },
      { from: "related", to: "related_3" }
    );
  }

  private addDesignNodes(nodes: MindMapNode[], edges: MindMapEdge[]): void {
    nodes.push(
      { id: "overview_1", label: "Create user-centered digital experiences", type: "detail" },
      { id: "overview_2", label: "Design interfaces and user flows", type: "detail" },
      { id: "roadmap_foundational", label: "Foundational", type: "sub_branch" },
      { id: "skill_figma", label: "Figma & Design Tools", type: "skill" },
      { id: "job_1", label: "UI Designer (₹3-7 LPA)", type: "detail" },
      { id: "related_1", label: "Product Design", type: "detail" }
    );
    edges.push(
      { from: "overview", to: "overview_1" },
      { from: "overview", to: "overview_2" },
      { from: "roadmap", to: "roadmap_foundational" },
      { from: "roadmap_foundational", to: "skill_figma" },
      { from: "jobs", to: "job_1" },
      { from: "related", to: "related_1" }
    );
  }

  private addProductManagerNodes(nodes: MindMapNode[], edges: MindMapEdge[]): void {
    nodes.push(
      { id: "overview_1", label: "Drive product strategy and vision", type: "detail" },
      { id: "overview_2", label: "Coordinate between teams and stakeholders", type: "detail" },
      { id: "roadmap_foundational", label: "Foundational", type: "sub_branch" },
      { id: "skill_strategy", label: "Strategic Thinking", type: "skill" },
      { id: "job_1", label: "Associate PM (₹6-12 LPA)", type: "detail" },
      { id: "related_1", label: "Business Analysis", type: "detail" }
    );
    edges.push(
      { from: "overview", to: "overview_1" },
      { from: "overview", to: "overview_2" },
      { from: "roadmap", to: "roadmap_foundational" },
      { from: "roadmap_foundational", to: "skill_strategy" },
      { from: "jobs", to: "job_1" },
      { from: "related", to: "related_1" }
    );
  }

  private generateFallbackMindMap(answers: Record<string, string>): MindMap {
    console.log('Generating fallback mind map...');
    const interestTags = this.inferInterestsFromAnswers(answers);
    const primaryCareer = this.determinePrimaryCareer(interestTags);
    return this.generateStructuredMindMap(primaryCareer, interestTags);
  }
}

export const aiService = new AIService();