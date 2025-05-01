import { NextResponse } from "next/server";
import { storage, bucketName } from "../../../../lib/storage/gcs";

export async function POST(request: Request) {
  try {
    const { password, oldUsername, newUsername } = await request.json();

    // Validate input
    if (!oldUsername || !newUsername) {
      return NextResponse.json(
        { error: "Both oldUsername and newUsername are required" },
        { status: 400 },
      );
    }

    const bucket = storage.bucket(bucketName);

    // Check if old username folder exists
    const [oldFiles] = await bucket.getFiles({ prefix: `${oldUsername}/` });
    if (oldFiles.length === 0) {
      return NextResponse.json(
        { error: `Folder for ${oldUsername} not found` },
        { status: 404 },
      );
    }

    console.log(
      `Found ${oldFiles.length} files to move from ${oldUsername} to ${newUsername}`,
    );

    // Track success of operations
    const successful = {
      copies: 0,
      deletions: 0,
      totalFiles: oldFiles.length,
      credentialsUpdated: false,
    };

    // First handle the credentials file if it exists
    const credentialsPath = `${oldUsername}/credentials/login_credentials.json`;
    let credentialsUpdated = false;

    try {
      const credentialsFile = bucket.file(credentialsPath);
      const [exists] = await credentialsFile.exists();

      if (exists) {
        // Get and update credentials
        const [content] = await credentialsFile.download();
        const credentials = JSON.parse(content.toString());

        // Update all relevant fields
        credentials.userId = newUsername;
        credentials.last_modified = new Date().toISOString();

        // Update password if provided
        if (password && password.trim() !== '') {
          credentials.password = password;
          console.log('Updating password in credentials:', password);
        }

        // Save to new location
        const newCredentialsPath = `${newUsername}/credentials/login_credentials.json`;
        const newCredentialsFile = bucket.file(newCredentialsPath);

        // Make sure parent directories exist
        await bucket
          .file(`${newUsername}/`)
          .save("", { contentType: "application/x-directory" });
        await bucket
          .file(`${newUsername}/credentials/`)
          .save("", { contentType: "application/x-directory" });

        await newCredentialsFile.save(JSON.stringify(credentials, null, 2));
        successful.credentialsUpdated = true;
        successful.copies++;

        console.log(
          `Updated credentials from ${credentialsPath} to ${newCredentialsPath}`,
        );
      }
    } catch (error) {
      console.error("Error processing credentials:", error);
    }

    // Copy all other files
    for (const file of oldFiles) {
      try {
        // Skip credentials file if already processed
        if (file.name === credentialsPath && successful.credentialsUpdated) {
          continue;
        }

        const newPath = file.name.replace(`${oldUsername}/`, `${newUsername}/`);
        const newFile = bucket.file(newPath);

        // Copy file to new location with metadata
        const [metadata] = await file.getMetadata();
        await file.copy(newFile, { metadata });
        successful.copies++;

        console.log(`Copied ${file.name} to ${newPath}`);
      } catch (error) {
        console.error(`Failed to copy ${file.name}:`, error);
      }
    }

    // Explicitly wait for all copy operations to complete before deleting
    console.log(
      `Successfully copied ${successful.copies} out of ${successful.totalFiles} files`,
    );

    // Force a small delay to ensure all copy operations are complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Delete old files one by one
    for (const file of oldFiles) {
      try {
        // Double check the file exists before attempting to delete
        const [exists] = await file.exists();
        if (exists) {
          await file.delete({ ignoreNotFound: true });
          successful.deletions++;
          console.log(`Deleted ${file.name}`);
        } else {
          console.warn(`File ${file.name} no longer exists, skipping deletion`);
        }
      } catch (error) {
        console.error(`Failed to delete ${file.name}:`, error);
      }
    }

    // Double-check deletion by listing files again
    const [remainingFiles] = await bucket.getFiles({
      prefix: `${oldUsername}/`,
    });

    // If files remain, try one more time with force option
    if (remainingFiles.length > 0) {
      console.warn(
        `${remainingFiles.length} files still remain after deletion attempt, trying again...`,
      );

      for (const file of remainingFiles) {
        try {
          // Force delete with generation match = 0 (deletes any generation)
          await file.delete({
            ignoreNotFound: true,
            generationMatchPrecondition: 0,
          });
          console.log(`Force deleted ${file.name}`);
        } catch (error) {
          console.error(`Failed to force delete ${file.name}:`, error);
        }
      }
    }

    return NextResponse.json({
      success:
        successful.copies === successful.totalFiles &&
        successful.deletions === successful.totalFiles,
      report: {
        filesCopied: successful.copies,
        filesDeleted: successful.deletions,
        totalFiles: successful.totalFiles,
        credentialsUpdated: successful.credentialsUpdated,
        oldFolderEmpty: remainingFiles.length === 0,
      },
    });
  } catch (error) {
    console.error("Error renaming folder:", error);
    return NextResponse.json(
      { error: `Failed to rename folder: ${error.message}` },
      { status: 500 },
    );
  }
}