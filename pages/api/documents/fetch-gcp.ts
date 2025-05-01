import { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { getSession } from 'next-auth/react';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { path } = req.query;
    
    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Invalid document path' });
    }

    // Initialize Google Cloud Storage
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE, // Path to your service account key file
    });

    const bucketName = process.env.GCP_BUCKET_NAME || 'your-bucket-name';
    
    // Use the full path as provided without modification
    const filePath = path;

    console.log(`Fetching document from GCP bucket: ${bucketName}, path: ${filePath}`);

    // Get file from GCP bucket
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'Document not found in bucket' });
    }

    // Get file content
    const [content] = await file.download();
    
    // Return the document content
    return res.status(200).json({ 
      content: content.toString('utf-8'),
      path: path 
    });
    
  } catch (error) {
    console.error('Error fetching document from GCP:', error);
    return res.status(500).json({ error: 'Failed to fetch document from GCP bucket' });
  }
}
