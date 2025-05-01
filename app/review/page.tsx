'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Recording } from '../../lib/context/InterviewContext';
import { localStorageService } from '../../lib/storage/localStorageService';

const questions = [
  "What are your earliest childhood memories that you cherish the most?",
  "Who were the most influential people in your life and what did they teach you?",
  "What accomplishments are you most proud of in your life?",
  "What wisdom or life lessons would you want to share with future generations?",
  "What are your hopes and wishes for your loved ones after you're gone?",
];

export default function Review() {
  const [recordings, setRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    try {
      const savedRecordings = localStorageService.getSessionRecordings();
      console.log('Retrieved recordings:', savedRecordings);
      setRecordings(savedRecordings);
    } catch (error) {
      console.error('Error loading recordings:', error);
      setRecordings([]);
    }
  }, []);

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-light mb-8 text-center">
          Review Your Life Story
        </h1>

        {recordings.length > 0 ? (
          <div className="space-y-6">
            {recordings.map((recording, index) => (
              <div key={recording.id} className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl mb-2">Question {recording.questionIndex + 1}</h3>
                <p className="text-slate-300 mb-4">{questions[recording.questionIndex]}</p>
                <audio 
                  src={`/api/audio/${user?.id?.toLowerCase()}/${recording.questionIndex + 1}`}
                  controls 
                  className="w-full mb-4" 
                  onPlay={() => console.log('Playing audio:', recording.id)}
                  onError={(e) => {
                    console.error('Audio playback error:', e);
                    const audio = e.target as HTMLAudioElement;
                    console.log('Attempted audio URL:', audio.src);
                  }}
                />
                {recording.transcript && (
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h4 className="text-md font-medium mb-2">Transcript:</h4>
                    <p className="text-slate-300">{recording.transcript}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <p>No recordings found. <Link href="/interview" className="text-blue-400 hover:text-blue-300">Start your interview</Link> to record your life story.</p>
          </div>
        )}
      </div>
    </main>
  );
}