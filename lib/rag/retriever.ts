
import { Storage } from '@google-cloud/storage';
import getVertexAI from '../api/vertexai';

// Initialize Google Cloud Storage
const getStorage = () => {
  const credentials = JSON.parse(process.env.GCP_SA_KEY || '{}');
  return new Storage({
    credentials
  });
};

// Function to retrieve user documents from GCP bucket
export async function retrieveUserDocuments(userId: string): Promise<string[]> {
  try {
    const storage = getStorage();
    const bucketName = 'memorial-voices';
    
    // Define paths to check for user documents
    const documentPaths = [
      `${userId}/documents/`,
      `${userId}/profile_description/`,
      `${userId}/transcriptions/`
    ];
    
    let allDocuments: string[] = [];
    
    // Retrieve documents from each path
    for (const docPath of documentPaths) {
      const [files] = await storage.bucket(bucketName).getFiles({
        prefix: docPath
      });
      
      // Process each file
      for (const file of files) {
        const [content] = await file.download();
        allDocuments.push(content.toString('utf-8'));
      }
    }
    
    return allDocuments;
  } catch (error) {
    console.error('Error retrieving user documents:', error);
    return [];
  }
}

// Function to generate embeddings (using Vertex AI)
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const vertexAI = getVertexAI();
    const model = "textembedding-gecko"; // Use appropriate embedding model
    
    const embeddingModel = vertexAI.getGenerativeModel({
      model: model,
    });
    
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return [];
  }
}

// Main RAG function to retrieve context for a question
export async function retrieveContext(userId: string, question: string): Promise<string> {
  try {
    // Retrieve user documents
    const documents = await retrieveUserDocuments(userId);
    
    if (documents.length === 0) {
      return '';
    }
    
    // Simple keyword-based retrieval for now
    // In a full implementation, you would use embeddings and vector similarity
    const relevantDocs = documents.filter(doc => 
      doc.toLowerCase().includes(question.toLowerCase())
    );
    
    // Combine relevant documents
    return relevantDocs.join('\n\n');
  } catch (error) {
    console.error('Error retrieving context:', error);
    return '';
  }
}
