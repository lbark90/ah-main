"use client";

import { useEffect } from 'react';
import { useUser } from '../../lib/context/UserContext';
import { useRouter } from 'next/navigation';
import ConversationUI from '../../components/audio/ConversationUI';

export default function ConversationPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Show loading state while checking authentication
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-900">
      <div className="container mx-auto h-full px-4 py-8">
        <h1 className="text-2xl font-semibold text-white mb-6">Conversation</h1>
        <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden h-[calc(100vh-10rem)]">
          <ConversationUI
            userName={`${user.firstName || ''} ${user.lastName || ''}`}
            userDob={''}
          />
        </div>
      </div>
    </div>
  );
}