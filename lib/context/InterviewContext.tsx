'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { localStorageService } from '../storage/localStorageService';

export interface Recording {
  id: string;
  audioUrl: string;
  transcript: string;
  timestamp: string;
  questionIndex: number;
}

export interface InterviewSession {
  id: string;
  questionIndex: number;
  recordings: Recording[];
  completedAt?: string;
}

interface InterviewContextType {
  currentSession: InterviewSession | null;
  startNewSession: () => void;
  addRecording: (recording: Recording) => void;
  replaceRecording: (recording: Recording) => void;
  getCurrentQuestionRecording: () => Recording | undefined;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => boolean;
  completeSession: () => Promise<void>;
}

const InterviewContext = createContext<InterviewContextType>({
  currentSession: null,
  startNewSession: () => {},
  addRecording: () => {},
  replaceRecording: () => {},
  getCurrentQuestionRecording: () => undefined,
  goToNextQuestion: () => {},
  goToPreviousQuestion: () => false,
  completeSession: async () => {},
});

export function InterviewProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);

  const startNewSession = (existingRecordings: Recording[] = []) => {
    // Find the highest question index from existing recordings
    const lastQuestionIndex = existingRecordings.length > 0
      ? Math.max(...existingRecordings.map(r => r.questionIndex)) + 1 // Add 1 to move to next unanswered question
      : 0;

    const session = {
      id: `session_${Date.now()}`,
      questionIndex: lastQuestionIndex,
      recordings: Array.isArray(existingRecordings) ? existingRecordings : [],
    };
    setCurrentSession(session);
  };

  const addRecording = (recording: Recording) => {
    if (!currentSession) return;
    try {
      localStorageService.saveRecording(recording);
      const updatedRecordings = [...currentSession.recordings];
      updatedRecordings.push(recording);

      const updatedSession = {
        ...currentSession,
        recordings: updatedRecordings,
      };
      setCurrentSession(updatedSession);
    } catch (error) {
      console.error('Failed to save recording:', error);
      throw error;
    }
  };

  const replaceRecording = (recording: Recording) => {
    if (!currentSession) return;
    try {
      const index = currentSession.recordings.findIndex(r => r.questionIndex === recording.questionIndex);
      if (index !== -1) {
        localStorageService.replaceRecording(index, recording);
        const updatedRecordings = [...currentSession.recordings];
        updatedRecordings[index] = recording;

        const updatedSession = {
          ...currentSession,
          recordings: updatedRecordings,
        };
        setCurrentSession(updatedSession);
      }
    } catch (error) {
      console.error('Failed to replace recording:', error);
      throw error;
    }
  };

  const getCurrentQuestionRecording = () => {
    if (!currentSession) return undefined;
    return currentSession.recordings.find(r => r.questionIndex === currentSession.questionIndex);
  };

  const goToNextQuestion = () => {
    if (!currentSession) return;
    const updatedSession = {
      ...currentSession,
      questionIndex: currentSession.questionIndex + 1,
    };
    setCurrentSession(updatedSession);
  };

  const goToPreviousQuestion = () => {
    if (!currentSession || currentSession.questionIndex === 0) return false;
    const updatedSession = {
      ...currentSession,
      questionIndex: currentSession.questionIndex - 1,
    };
    setCurrentSession(updatedSession);
    return true;
  };

  const completeSession = async () => {
    if (!currentSession) return;
    const updatedSession = {
      ...currentSession,
      completedAt: new Date().toISOString(),
    };
    setCurrentSession(updatedSession);
  };

  return (
    <InterviewContext.Provider
      value={{
        currentSession,
        startNewSession,
        addRecording,
        replaceRecording,
        getCurrentQuestionRecording,
        goToNextQuestion,
        goToPreviousQuestion,
        completeSession,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export const useInterview = () => useContext(InterviewContext);