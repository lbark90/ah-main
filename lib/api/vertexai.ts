
import { VertexAI } from '@google-cloud/vertexai';

const getVertexAI = () => {
  const credentials = JSON.parse(process.env.GCP_SA_KEY || '{}');
  const projectId = credentials.project_id;
  const location = 'us-central1';  // or your preferred location

  return new VertexAI({
    project: projectId,
    location: location,
    credentials: credentials
  });
};

export default getVertexAI;
