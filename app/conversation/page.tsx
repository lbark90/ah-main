"use client";

import { useState, useEffect } from "react";
import { useUser } from "../../lib/context/UserContext";
import { useVoice } from "../../lib/context/VoiceContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConversationUI from "../../components/audio/ConversationUI";

export default function Conversation() {
  const { user } = useUser();
  const { voice, textToSpeech } = useVoice();
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [memorializedName, setMemorializedName] = useState("");
  const [creationDate, setCreationDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState("");
  const [userDob, setUserDob] = useState(""); // Add state for date of birth
  const [hasVoiceId, setHasVoiceId] = useState(true); // New state for voice ID check

  // Connection status for WebSocket
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Load user data and interview session on component mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && user) {
        // Set the user name (for display in UI)
        setUserName(`${user.firstName || ''} ${user.lastName || ''}`);
        
        // For memorial name, we should use the actual user's name
        // This is who the conversation will be with
        setMemorializedName(`${user.firstName || ''} ${user.lastName || ''}`);
        
        // Set user's date of birth - only use what comes from the user object
        // @ts-ignore - Using any available DOB property without defaults
        const userDateOfBirth = user.dob || user.dateOfBirth || '';
        setUserDob(userDateOfBirth);
        
        console.log("User profile loaded:", {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          // @ts-ignore - Only log the actual DOB without defaults
          dob: user.dob || user.dateOfBirth || ''
        });

        // Check if the user has a voice ID
        checkVoiceId(user.id);
      }

      // Check if interview is completed
      const storedSession = localStorage.getItem("aliveHereInterviewSession");
      
      // Set creation date
      setCreationDate(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );

      // Generate welcome message audio
      generateWelcomeAudio();

      setIsLoading(false);
    } catch (error) {
      console.error('Error in useEffect:', error);
      setIsLoading(false);
    }
  }, [user, voice, router]);

  // Check if the user has a voice ID
  const checkVoiceId = async (userId) => {
    try {
      const response = await fetch(`/api/voice/id?userId=${userId}`);
      if (response.status === 404) {
        setHasVoiceId(false);
      }
    } catch (error) {
      console.error("Error checking voice ID:", error);
      setHasVoiceId(false);
    }
  };

  // Generate welcome audio using the cloned voice
  const generateWelcomeAudio = async () => {
    try {
      if (!voice) return;

      const welcomeText =
        "Hello, it's wonderful to connect with you. I'm here to share memories and wisdom. What would you like to talk about today?";

      // Skip welcome audio for now since textToSpeech is not ready
      console.log("Welcome message:", welcomeText);
    } catch (error) {
      console.error("Error generating welcome audio:", error);
    }
  };

  // Handle conversation end
  const handleConversationEnd = () => {
    console.log("Conversation ended");
    // In a real implementation, this would save conversation data
  };

  // If no voice ID, show a message with a link to the interview page
  if (!hasVoiceId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">
            No profile found. Please complete the interview process to continue.
          </p>
          <Link href="/interview" className="text-blue-400 underline">
            Go to Interview Page
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading your conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <header className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 mb-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-light">
                  Conversation with {memorializedName}
                </h1>
                <p className="text-slate-400">Created on {creationDate}</p>
              </div>
            </div>

            {audioUrl && (
              <div className="mb-8 hidden">
                <audio src={audioUrl} autoPlay />
              </div>
            )}

            <ConversationUI
              userName={userName}
              memorializedName={memorializedName}
              onConversationEnd={handleConversationEnd}
            />

            <div className="text-center text-slate-400 mt-6">
              <p>
                This conversation is with a digital recreation based on{" "}
                <strong>{memorializedName}'s </strong>recorded memories and personality. While it reflects their essence, it is an AI representation
                created to preserve their legacy.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              Return to home
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-slate-950 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} AliveHere. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}