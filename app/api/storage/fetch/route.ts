import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

const storage = new Storage();  // Use default credentials
const bucketName = process.env.GCP_BUCKET_NAME || 'memorial-voices';

export async function GET(request: Request) {
  console.log('Fetching from bucket:', bucketName);
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    try {
      const bucket = storage.bucket(bucketName);
      const decodedPath = decodeURIComponent(filePath).trim();
      const file = bucket.file(decodedPath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`File not found: ${decodedPath}`);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      console.log(`File exists: ${decodedPath}`);
      
      // For JSON files, return the contents directly
      if (decodedPath.endsWith('.json')) {
        const [fileContents] = await file.download();
        try {
          const jsonData = JSON.parse(fileContents.toString());
          return NextResponse.json(jsonData);
        } catch (error) {
          console.error(`Error parsing JSON file: ${decodedPath}`, error);
          return NextResponse.json({ error: 'Invalid JSON file' }, { status: 500 });
        }
      }

      // Get file contents
      const [content] = await file.download();
      
      try {
        // Try to parse as JSON
        const jsonContent = JSON.parse(content.toString());
        console.log('Fetched credentials:', jsonContent);
        return NextResponse.json(jsonContent);
      } catch {
        // If not JSON, return raw content
        return new NextResponse(content);
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch file', 
        details: error.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Request error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request', 
      details: error.message 
    }, { status: 500 });
  }
}
