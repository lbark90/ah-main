
import { Storage } from '@google-cloud/storage';

// Initialize storage with credentials
const storage = new Storage({
  keyFilename: './credentials/gcp-credentials.json',
  projectId: process.env.GCP_PROJECT_ID
});

export { storage };
