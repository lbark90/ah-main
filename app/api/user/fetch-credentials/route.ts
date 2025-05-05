import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

// Use environment variable or fallback to default bucket name
const bucketName = process.env.GCS_BUCKET_NAME || "memorial-voices";
const storage = new Storage();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }

  try {
    // First try to fetch from credentials folder
    const credentialsPath = `${userId}/credentials/login_credentials.json`;
    console.log(`Looking for credentials at path: ${credentialsPath}`);

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(credentialsPath);

    const [exists] = await file.exists();
    if (!exists) {
      console.log(`Credentials file not found at path: ${credentialsPath}`);

      // Try alternative locations
      const alternativePaths = [
        `${userId}/profile_data.json`,
        `${userId}/user_data.json`,
        `${userId}/user_profile.json`
      ];

      for (const altPath of alternativePaths) {
        console.log(`Checking alternative path: ${altPath}`);
        const altFile = bucket.file(altPath);
        const [altExists] = await altFile.exists();

        if (altExists) {
          console.log(`Found file at: ${altPath}`);
          const [content] = await altFile.download();
          const userData = JSON.parse(content.toString());

          return NextResponse.json({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            dob: userData.dateOfBirth || userData.dob || "",
            source: altPath
          });
        }
      }

      // No user data found, return empty values
      console.log("No user data found in any location");
      return NextResponse.json({
        firstName: "",
        lastName: "",
        dob: "",
        source: "none"
      });
    }

    // Get credentials from primary location
    const [content] = await file.download();
    const credentials = JSON.parse(content.toString());

    return NextResponse.json({
      firstName: credentials.firstName || "",
      lastName: credentials.lastName || "",
      dob: credentials.dateOfBirth || credentials.dob || "",
      source: credentialsPath
    });
  } catch (error) {
    console.error("Error fetching credentials from GCS:", error);
    return NextResponse.json({
      error: "Failed to fetch credentials",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
