import { NextResponse } from "next/server";
import { storage, bucketName } from "../../../../lib/storage/gcs";

export async function POST(request: Request) {
  try {
    const { username, currentPassword, newPassword } = await request.json();

    // Validate input
    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const bucket = storage.bucket(bucketName);

    // Define the path to the credentials file
    const credentialsPath = `${username}/credentials/login_credentials.json`;
    const credentialsFile = bucket.file(credentialsPath);

    // Check if file exists
    const [exists] = await credentialsFile.exists();
    if (!exists) {
      return NextResponse.json(
        { error: "Credentials file not found" },
        { status: 404 },
      );
    }

    // Get the current credentials
    const [content] = await credentialsFile.download();
    let credentials;

    try {
      credentials = JSON.parse(content.toString());

      // Verify current password (if you store hashed passwords, you'd need to compare hashes)
      if (credentials.password !== currentPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 },
        );
      }

      // Update the password and last_modified timestamp
      credentials.password = newPassword;
      credentials.last_modified = new Date().toISOString();

      // Save the updated credentials
      await credentialsFile.save(JSON.stringify(credentials, null, 2));

      return NextResponse.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in password update route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
