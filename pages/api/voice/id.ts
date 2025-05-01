import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Storage } from '@google-cloud/storage';

type VoiceIdResponse = {
  voiceId?: string;
  name?: string;
  error?: string;
  found: boolean;
  source?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VoiceIdResponse>
) {
  console.log("Pages Router Voice ID API endpoint called");
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', found: false });
  }

  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing userId parameter', found: false });
  }

  try {
    // Look for the voice_id.json file in GCP first
    let voiceId: string | null = null;
    let voiceName = null;
    let sourceLocation = '';
    
    // GCP bucket configuration - ENSURE it matches your path
    const bucketName = process.env.GCS_BUCKET_NAME || 'memorial-voices';
    
    console.log(`Attempting to find voice ID for user ${userId} in GCS bucket: ${bucketName}`);
    
    // Define the local credentials file path
    const localCredentialsPath = path.join(process.cwd(), 'google_credentials.json');
    
    // Use environment variable or fall back to local credentials file
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                           (fs.existsSync(localCredentialsPath) ? localCredentialsPath : null);
    
    if (!credentialsPath) {
      console.warn("Google credentials not found - checked environment variable and local file");
      console.warn("GCP Storage access will not be available");
    } else {
      console.log(`Using Google credentials from: ${credentialsPath}`);
      
      try {
        // Initialize Storage with credentials
        const storage = new Storage({
          keyFilename: credentialsPath
        });
        
        const bucket = storage.bucket(bucketName);
        const voiceIdPath = `${userId}/voice_id/voice_id.json`;
        const fullGcsPath = `gs://${bucketName}/${voiceIdPath}`;
        
        console.log(`Looking for voice_id.json at: ${fullGcsPath}`);
        
        // Check if the file exists
        const [fileExists] = await bucket.file(voiceIdPath).exists();
        
        if (fileExists) {
          console.log(`✅ Found voice_id.json in GCS at ${fullGcsPath}`);
          
          // Download and parse the file
          const [fileContents] = await bucket.file(voiceIdPath).download();
          console.log(`Downloaded voice_id.json, size: ${fileContents.length} bytes`);
          
          // Log the raw file content to aid debugging
          console.log(`Voice ID JSON content: ${fileContents.toString().substring(0, 200)}${fileContents.length > 200 ? '...' : ''}`);
          
          try {
            // Parse the JSON content
            const voiceData = JSON.parse(fileContents.toString());
            
            // Check for both possible property names - the file uses "user_voice_id" not "voiceId"
            if (voiceData && (voiceData.voiceId || voiceData.user_voice_id)) {
              // Prioritize user_voice_id if it exists, then fall back to voiceId
              voiceId = voiceData.user_voice_id || voiceData.voiceId;
              console.log(`Extracted voice ID from GCS: ${voiceId}`);
              voiceName = voiceData.name || `Voice for ${userId}`;
              sourceLocation = 'gcs';
            } else {
              console.error("JSON file exists but doesn't contain a voice ID property");
              console.log("Available fields:", Object.keys(voiceData).join(', '));
            }
          } catch (jsonError) {
            console.error("Error parsing voice_id.json:", jsonError);
            console.log("Raw content:", fileContents.toString().substring(0, 100));
            
            // Attempt to extract voice ID if file is not valid JSON
            // Look for both property names in regex
            const voiceIdMatch = fileContents.toString().match(/"(voiceId|user_voice_id)"\s*:\s*"([^"]+)"/);
            if (voiceIdMatch && voiceIdMatch[2]) {
              console.log(`Extracted voice ID using regex: ${voiceIdMatch[2]}`);
              voiceId = voiceIdMatch[2];
              sourceLocation = 'gcs-regex';
            }
          }
        } else {
          console.log(`❌ No voice_id.json found at ${fullGcsPath}`);
          
          // Try listing files in the user's voice_id directory for debugging
          const [files] = await bucket.getFiles({ 
            prefix: `${userId}/voice_id/` 
          });
          
          console.log(`Files found in ${userId}/voice_id/ directory: ${files.length}`);
          
          if (files.length > 0) {
            console.log("Available files:");
            files.forEach(file => console.log(`- ${file.name}`));
            
            // Try to use the first file that might contain voice ID info
            for (const file of files) {
              if (file.name.includes('voice') || file.name.endsWith('.json')) {
                console.log(`Attempting to use alternative file: ${file.name}`);
                const [altContents] = await file.download();
                try {
                  const altData = JSON.parse(altContents.toString());
                  // Check for both property names here too
                  if (altData.voiceId || altData.user_voice_id) {
                    const foundVoiceId = altData.user_voice_id || altData.voiceId;
                    console.log(`Found voice ID in alternative file: ${foundVoiceId}`);
                    voiceId = foundVoiceId;
                    voiceName = altData.name || `Voice for ${userId}`;
                    sourceLocation = 'gcs-alt';
                    break;
                  }
                } catch (e) {
                  console.log(`Could not parse ${file.name} as JSON`);
                }
              }
            }
          }
        }
      } catch (gcpError) {
        console.error("Error accessing GCP:", gcpError);
      }
    }
    
    // If we still don't have a voice ID, try the local file system
    if (!voiceId) {
      try {
        const localVoiceIdPath = path.join(process.cwd(), 'public', 'recordings', userId, 'voice_id.json');
        
        if (fs.existsSync(localVoiceIdPath)) {
          console.log(`Found voice_id.json locally for user ${userId}`);
          const fileContents = fs.readFileSync(localVoiceIdPath, 'utf8');
          const voiceData = JSON.parse(fileContents);
          
          if (voiceData && (voiceData.voiceId || voiceData.user_voice_id)) {
            console.log(`Using voice ID from local file: ${voiceData.user_voice_id || voiceData.voiceId}`);
            voiceId = voiceData.user_voice_id || voiceData.voiceId;
            voiceName = voiceData.name || `Voice for ${userId}`;
            sourceLocation = 'local';
          }
        } else {
          console.log(`No voice_id.json found locally for user ${userId}`);
        }
      } catch (fsError) {
        console.error("Error reading local voice_id.json:", fsError);
      }
    }

    // If no voice ID was found, return an error
    if (!voiceId) {
      console.error(`No voice ID found for user ${userId}`);
      return res.status(404).json({ 
        error: `No voice found for user ID ${userId}. Please create a voice first.`,
        found: false
      });
    }

    console.log(`Returning voice ID for user ${userId}: ${voiceId} (source: ${sourceLocation})`);
    return res.status(200).json({ 
      voiceId: voiceId,
      name: voiceName || "",
      found: true,
      source: sourceLocation
    });
      
  } catch (error) {
    console.error("Error retrieving voice ID:", error);
    
    return res.status(500).json({
      error: `Failed to retrieve voice ID: ${error.message}`,
      found: false
    });
  }
}
