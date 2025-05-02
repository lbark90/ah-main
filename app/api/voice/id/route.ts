import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("Pages Router Voice ID API endpoint called");

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  // If userId is empty, just return a default response without logging an error
  if (!userId) {
    return NextResponse.json({ voiceId: null, message: "No user logged in" }, { status: 200 });
  }

  // Continue with the rest of the handler for authenticated users
  try {
    // Placeholder logic for fetching voice ID
    const voiceId = `voice-${userId}`; // Replace with actual logic to fetch voice ID

    return NextResponse.json({ voiceId });
  } catch (error) {
    console.error("Error fetching voice ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice ID" },
      { status: 500 }
    );
  }
}