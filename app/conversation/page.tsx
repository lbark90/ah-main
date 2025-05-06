"use client";

import { useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useUser } from '../../lib/context/UserContext';
import { initializeSocket } from 'lib/audio/socket';

// Use dynamic import with SSR disabled and ensure the default export is resolved
const ConversationUI = dynamic(
  () => import('../../components/audio/ConversationUI').then((mod) => mod.default),
  { ssr: false }
);

export default function ConversationPage() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    console.log("User data in ConversationPage:", user);

    if (isLoading) {
      console.log("Still loading user, skipping socket init for now.");
      return;
    }

    if (user) {
      console.log("Initializing socket with user ID:", user.id);
      try {
        initializeSocket(user.id || '');
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    } else {
      console.warn("No user found after loading, skipping socket initialization.");
    }

    // Apply the background color directly
    document.body.style.backgroundColor = '#0f172a';
    document.documentElement.style.backgroundColor = '#0f172a';
    document.body.classList.add('conversation-page');

    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      document.body.classList.remove('conversation-page');
    };
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a102a]">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-300">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a102a]">
        <div className="p-8 bg-slate-800 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-2xl font-medium text-white mb-4">Login Required</h2>
          <p className="text-slate-300 mb-6">
            Please log in to access the conversation.
          </p>
          <button
            onClick={() => window.location.href = "/login"}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-medium rounded-lg flex items-center justify-center"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <ConversationUI
        userName={user.firstName || "User"}
        memorializedName={
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.lastName || user.firstName || "AI Assistant"
        }
        onConversationEnd={() => console.log("Conversation ended")}
        userDob={user.dob || ""}
      />
    </div>
  );
}