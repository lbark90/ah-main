'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface VoiceData {
  voiceId: string;
  name: string;
  status: string;
  createdAt: string;
  userId: string;
  voiceFilePath?: string;
  cloudPath?: string;
  isElevenLabsVoice?: boolean;
  elevenLabsData?: any;
}

interface VoiceContextType {
  voice: VoiceData | null;
  setVoice: (voice: VoiceData | null) => void;
}

const VoiceContext = createContext<VoiceContextType>({
  voice: null,
  setVoice: () => {},
});

export const useVoice = () => useContext(VoiceContext);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [voice, setVoice] = useState<VoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  //Fallback voice data
  const fallbackVoice: VoiceData = {
    voiceId: 'fallback',
    name: 'Fallback Voice',
    status: 'fallback',
    createdAt: new Date().toISOString(),
    userId: '',
    isElevenLabsVoice: false
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/registration') {
      try {
        const storedVoice = localStorage.getItem('aliveHereVoice');
        const userId = localStorage.getItem('userId');

        if (!userId) {
          console.log('Skipping voice initialization - no user logged in');
          return;
        }

        console.log('VoiceProvider initializing, userId:', userId);

        if (storedVoice) {
          const parsedVoice = JSON.parse(storedVoice);
          if (parsedVoice && parsedVoice.voiceId) {
            console.log('Loading voice from storage:', parsedVoice);
            setVoice(parsedVoice);

            // Also check voice API to ensure everything is in sync
            if (userId) {
              console.log('Validating voice with API call');
              checkVoiceAPI(userId);
            }
          } else {
            console.log('Invalid voice data structure in localStorage');
            if (userId) checkVoiceAPI(userId);
          }
        } else {
          console.log('No voice data found in localStorage');

          // Always check the API for voice data when nothing in localStorage
          if (userId) {
            checkVoiceAPI(userId);
          }
        }
      } catch (error) {
        console.error('Voice data initialization error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setVoice(fallbackVoice); // Use fallback on error
      }
    }
  }, []);

  // Function to check voice API if no voice is in storage
  const checkVoiceAPI = async (userId: string | null) => {
    if (!userId) {
      console.error('Cannot check voice API: No user ID provided');
      return;
    }

    try {
      console.log('Checking voice API for user:', userId);
      setError(null);

      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/voice/check?userId=${userId}&t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      console.log('Voice API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Voice API returned data:', data);

        if (data.exists) {
          console.log('Voice exists, creating voice data object');
          const voiceData: VoiceData = {
            voiceId: data.voiceId,
            name: data.name || 'My Voice',
            status: data.status || 'ready',
            createdAt: new Date().toISOString(),
            userId: userId,
            isElevenLabsVoice: data.isElevenLabsVoice
          };

          console.log('Saving voice data to localStorage:', voiceData);
          localStorage.setItem('aliveHereVoice', JSON.stringify(voiceData));
          setVoice(voiceData);

          // If this is an ElevenLabs voice, fetch additional data
          if (data.isElevenLabsVoice && data.voiceId) {
            try {
              console.log('Fetching ElevenLabs voice details');
              const elevenLabsResponse = await fetch(`/api/voice/fetch-from-elevenlabs?voiceId=${data.voiceId}`);
              if (elevenLabsResponse.ok) {
                const elevenlabsData = await elevenLabsResponse.json();
                console.log('ElevenLabs data:', elevenlabsData);

                // Update voice data with ElevenLabs details
                const updatedVoiceData = {
                  ...voiceData,
                  elevenLabsData: elevenlabsData.voiceData
                };

                localStorage.setItem('aliveHereVoice', JSON.stringify(updatedVoiceData));
                setVoice(updatedVoiceData);
              }
            } catch (err) {
              console.error('Error fetching ElevenLabs data:', err);
              // Continue with basic voice data even if this fails
            }
          }
        } else {
          console.log('Voice API says voice does not exist');
          setVoice(fallbackVoice); // Use fallback if voice doesn't exist
        }
      } else {
        const errorText = await response.text();
        console.error('Voice check API error:', errorText);
        setError(`API error: ${response.status} - ${errorText}`);
        setVoice(fallbackVoice); // Use fallback on API error
        localStorage.setItem('aliveHereVoice', JSON.stringify(fallbackVoice));
      }
    } catch (error) {
      console.error('Error checking voice API:', error);
      setError(error instanceof Error ? error.message : 'Unknown API error');
      setVoice(fallbackVoice); // Use fallback on any error during API call
    }
  };

  return (
    <VoiceContext.Provider value={{ voice, setVoice }}>
      {children}
    </VoiceContext.Provider>
  );
}