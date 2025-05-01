import { storage, bucketName } from "../../../../lib/storage/gcs";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ params: string[] }> }
) {
  try {
    const { params } = await context.params;

    if (!params || !Array.isArray(params) || params.length < 2) {
      return new Response("Missing parameters", { status: 400 });
    }

    const [userId, questionNumber] = params;

    // Use userId directly without cleaning or transforming it
    // This ensures it matches exactly with your GCP bucket structure
    const cleanUserId = userId;

    console.log("Original userId:", userId);
    console.log("Using userId:", cleanUserId);

    const bucketPath = `${cleanUserId}/recordings/${questionNumber}/`;
    console.log("Searching bucket path:", bucketPath);

    const bucket = storage.bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix: bucketPath });

    console.log("Files found:", files.map(file => file.name));

    if (!files || files.length === 0) {
      console.error(`No files found in path: ${bucketPath}`);
      return new Response(`No audio files found for question ${questionNumber}`, { 
        status: 404 
      });
    }

    // Get the most recent recording file
    const audioFile = files[files.length - 1];
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
      { status: 500 }
    );
  }
}