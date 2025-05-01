import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

const storage = new Storage();  // Use default credentials
const bucketName = process.env.GCP_BUCKET_NAME || 'memorial-voices';
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ params: string[] }> },
) {
  try {
    const { params } = await context.params;

    if (!params || !Array.isArray(params) || params.length < 2) {
      return new Response("Missing parameters", { status: 400 });
    }

    // Hardcode the user ID mapping for now to test
    const requestedUserId = params[0];
    const questionNumber = params[1];

    console.log(
      `Overriding requested user ID ${params[0]} to ${requestedUserId}`,
    );
    console.log("Retrieving audio for:", {
      userId: requestedUserId,
      questionNumber,
    });

    // Get the recording files
    const bucket = storage.bucket(bucketName);
    const bucketPath = `${requestedUserId}/recordings/${questionNumber}/`;
    console.log("Searching bucket path:", bucketPath);

    const [files] = await bucket.getFiles({ prefix: bucketPath });

    console.log(
      "Files found:",
      files.map((file) => file.name),
    );

    if (!files || files.length === 0) {
      console.error(`No files found in path: ${bucketPath}`);
      return new Response(
        `No audio files found for question ${questionNumber}`,
        { status: 404 },
      );
    }

    // Get the most recent recording file
    const audioFile = files[files.length - 1];
    console.log("Selected file:", audioFile.name);
    const [audioBuffer] = await audioFile.download();

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching audio:", error);
    return new Response(
      `Failed to fetch audio: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 },
    );
  }
}
