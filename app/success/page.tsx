
'use client';

import { useEffect, useState } from 'react';
import { useInterview } from '../../lib/context/InterviewContext';
import { useVoice } from '../../lib/context/VoiceContext';
import { useUser } from '../../lib/context/UserContext';
import Link from 'next/link';

export default function SuccessPage() {
  const { currentSession } = useInterview();
  const { voice, setVoice } = useVoice();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkVoiceAndSendWebhook = async () => {
      try {
        if (user) {
          const voiceExists = await fetch(`/api/voice/check?userId=${user.id}`);
          const voiceData = await voiceExists.json();

          if (!voiceData.exists) {
            console.log('Voice not found, sending webhook...');
            const tokenResponse = await fetch('/api/auth/generate-token', {
              cache: 'no-store',
              headers: {
                'Accept': 'application/json'
              }
            });
            if (!tokenResponse.ok) {
              throw new Error(`Token fetch failed: ${tokenResponse.status}`);
            }
            const tokenData = await tokenResponse.json();
            if (!tokenData.token) {
              throw new Error('No token received from server');
            }
            const token = tokenData.token;
            const webhookData = {
              userId: user.id,
              userName: `${user.firstName}_${user.lastName}`,
              event: 'voice_missing'
            };
            console.log('Sending webhook with data:', webhookData);
            try {
              const response = await fetch('/api/webhook', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(webhookData)
              });
              if (!response.ok) {
                throw new Error(`Webhook failed with status: ${response.status}`);
              }
              const responseData = await response.json();
              console.log('Webhook response:', responseData);
            } catch (error) {
              console.error('Webhook error:', error);
              // Continue execution even if webhook fails
            }
            console.log('Webhook sent successfully');
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    checkVoiceAndSendWebhook();
  }, [user]);

  if (isProcessing) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Processing Your Recordings</h1>
          <p>Please wait while we process your recordings...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
        <p className="mb-6">Your recordings have been submitted successfully. Our team is now processing your voice profile.</p>
        <p className="mb-6 text-slate-300">Please allow approximately 30 minutes for processing. You will receive an email notification when your digital profile is ready for conversations.</p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-500 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
}
