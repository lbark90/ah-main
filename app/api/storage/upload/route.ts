import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
import os from 'os';

const storage = new Storage();  // Use default credentials
const bucketName = process.env.GCP_BUCKET_NAME || 'memorial-voices';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;
    const questionIndex = formData.get('questionIndex') as string;
    const username = formData.get('username') as string;

    console.log("Received upload request:", {
      fileSize: audioFile?.size,
      questionIndex,
      username,
      fileType: audioFile?.type
    });

    if (!audioFile || !questionIndex || !username) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Get audio data from the blob
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Upload the file directly with .mp3 extension
    // We'll accept WebM content but store with MP3 extension for compatibility
    // with existing playback code. In a production system we would use a proper
    // audio conversion service or ensure ffmpeg is installed.
    const filename = `${username}_q${questionIndex}_${timestamp}.mp3`;
    const destinationPath = `${username}/recordings/${questionIndex}/${filename}`;

    console.log(`Uploading audio file to ${destinationPath} (${buffer.length} bytes)`);

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(destinationPath);

    await file.save(buffer, {
      metadata: {
        contentType: 'audio/mpeg' // Set content type as MP3 for browser compatibility
      }
    });

    console.log(`Audio file uploaded successfully to ${destinationPath}`);

    return NextResponse.json({
      success: true,
      fileName: filename,
      storagePath: destinationPath
    });

  } catch (error) {
    console.error('Error uploading audio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : null;

    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}