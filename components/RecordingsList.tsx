"use client";

import { useState, useEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useUser } from "../lib/context/UserContext";

// Direct audio player component
function AudioPlayer({ src, questionIndex }: { src: string; questionIndex: number }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  
  useEffect(() => {
    console.log('AudioPlayer mounted for question:', questionIndex, 'src:', src);
    
    // Test fetch the audio directly to check if it exists
    const checkAudio = async () => {
      try {
        const response = await fetch(src);
        console.log('Audio fetch response:', response.status, 'for question:', questionIndex);
        
        if (response.ok) {
          // Make sure it has content
          const blob = await response.blob();
          if (blob.size > 0) {
            console.log('Audio content available, size:', blob.size, 'bytes');
            setStatus('ready');
          } else {
            console.log('Audio response was empty');
            setStatus('error');
          }
        } else {
          console.log('Audio fetch failed with status:', response.status);
          setStatus('error');
        }
      } catch (error) {
        console.error('Error checking audio:', error);
        setStatus('error');
      }
    };
    
    checkAudio();
    
    return () => {
      // Cleanup if needed
    };
  }, [src, questionIndex]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="text-slate-400 text-sm text-center py-2">
        <p>No recording available for this question yet.</p>
        <p className="text-xs mt-1">Record your answer using the Interview tab.</p>
      </div>
    );
  }
  
  // Audio is ready to play
  return (
    <audio 
      src={src} 
      controls 
      className="w-full" 
      preload="metadata"
      onError={(e) => {
        console.error('Audio element error:', e);
        setStatus('error');
      }}
    />
  );
}


import { useState, useEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useUser } from "../lib/context/UserContext";

interface Recording {
  section: string;
  text: string;
}

export function RecordingsList() {
  const { user } = useUser();
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const [audioStates, setAudioStates] = useState<{
    [key: string]: { loading: boolean; hasAudio: boolean };
  }>({});

  const questions = [
    // Life Overview
    {
      section: "Life Overview",
      text: "Share a story about your earliest memory.",
    },
    {
      section: "Life Overview",
      text: "Share a story about where you grew up and what it was like.",
    },
    {
      section: "Life Overview",
      text: "Share a story about your parents or grandparents that influenced you deeply.",
    },
    {
      section: "Life Overview",
      text: "Share a story about your siblings and your relationships with them.",
    },
    {
      section: "Life Overview",
      text: "Share a story about a family tradition that meant a lot to you.",
    },
    {
      section: "Life Overview",
      text: "What was your neighborhood like growing up?",
    },
    {
      section: "Life Overview",
      text: "Tell me about your best friend growing up.",
    },
    {
      section: "Life Overview",
      text: "What did you want to be when you grew up?",
    },
    {
      section: "Life Overview",
      text: "What were your favorite hobbies as a child?",
    },
    {
      section: "Life Overview",
      text: "Share a story about a time you felt most at peace with your life.",
    },
    {
      section: "Life Overview",
      text: "Tell me about a place that holds special meaning for you.",
    },
    {
      section: "Life Overview",
      text: "Share a story about your career path and what led you to your profession.",
    },
    {
      section: "Life Overview",
      text: "Share a story about how you met your spouse or a significant relationship.",
    },
    {
      section: "Life Overview",
      text: "Share a story about your school days that stands out in your memory.",
    },
    {
      section: "Life Overview",
      text: "What values or life lessons did your parents instill in you?",
    },
    {
      section: "Life Overview",
      text: "Tell me about a challenge you overcame that shaped who you are.",
    },
    {
      section: "Life Overview",
      text: "What are some family traditions that you've maintained or created?",
    },
    {
      section: "Life Overview",
      text: "Share a story about a mentor or teacher who influenced your life.",
    },
    {
      section: "Life Overview",
      text: "What achievements are you most proud of?",
    },
    {
      section: "Life Overview",
      text: "Tell me about a moment that changed your perspective on life.",
    },
    // School Years
    {
      section: "School Years",
      text: "What was your favorite subject in school?",
    },
    { section: "School Years", text: "Tell me about your favorite teacher." },
    { section: "School Years", text: "Share a memorable school experience." },
    {
      section: "School Years",
      text: "What extracurricular activities did you participate in?",
    },
    {
      section: "School Years",
      text: "What was your proudest academic achievement?",
    },
    {
      section: "School Years",
      text: "Tell me about your best friend from school.",
    },
    {
      section: "School Years",
      text: "What was your most challenging subject?",
    },
    {
      section: "School Years",
      text: "Share a funny story from your school days.",
    },
    { section: "School Years", text: "What did you enjoy most about school?" },
    { section: "School Years", text: "Tell me about your graduation day." },
    // Career
    { section: "Career", text: "What was your first job?" },
    { section: "Career", text: "What did you enjoy most about your career?" },
    {
      section: "Career",
      text: "Tell me about a mentor who influenced your career.",
    },
    {
      section: "Career",
      text: "What was your biggest professional challenge?",
    },
    {
      section: "Career",
      text: "What advice would you give to someone starting in your field?",
    },
    { section: "Career", text: "Share a proud moment in your career." },
    { section: "Career", text: "How did you choose your career path?" },
    {
      section: "Career",
      text: "What skills were most valuable in your career?",
    },
    {
      section: "Career",
      text: "Tell me about a difficult decision you made at work.",
    },
    {
      section: "Career",
      text: "What changes in your field have you witnessed?",
    },
    // Relationships
    { section: "Relationships", text: "How did you meet your spouse/partner?" },
    {
      section: "Relationships",
      text: "What's your favorite family tradition?",
    },
    { section: "Relationships", text: "Tell me about your children." },
    {
      section: "Relationships",
      text: "What's the best relationship advice you've received?",
    },
    {
      section: "Relationships",
      text: "What values did you try to pass on to your children?",
    },
    {
      section: "Relationships",
      text: "Share a special memory with your grandparents.",
    },
    {
      section: "Relationships",
      text: "Tell me about your siblings growing up.",
    },
    { section: "Relationships", text: "What makes a strong friendship?" },
    { section: "Relationships", text: "Share a memorable family vacation." },
    {
      section: "Relationships",
      text: "How has your family shaped who you are?",
    },
    // Life Lessons
    {
      section: "Life Lessons",
      text: "What's the most important life lesson you've learned?",
    },
    {
      section: "Life Lessons",
      text: "What advice would you give your younger self?",
    },
    { section: "Life Lessons", text: "What are you most proud of in life?" },
    { section: "Life Lessons", text: "What's your definition of success?" },
    { section: "Life Lessons", text: "What legacy do you hope to leave?" },
    { section: "Life Lessons", text: "What values matter most to you?" },
    {
      section: "Life Lessons",
      text: "Tell me about a mistake that taught you something valuable.",
    },
    { section: "Life Lessons", text: "What brings you the most joy in life?" },
    {
      section: "Life Lessons",
      text: "What do you wish more people understood?",
    },
    { section: "Life Lessons", text: "What gives you hope for the future?" },
  ];

  const toggleQuestion = async (index: number) => {
    console.log('Toggling question:', index);
    setExpandedQuestions((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        // When expanding, force this to be the only expanded question
        // This helps with audio loading and avoids conflicts
        return [index];
      }
    });
  };

  const getQuestionsBySection = () => {
    const sections = Array.from(new Set(questions.map((q) => q.section)));
    return sections.map((section) => ({
      section,
      questions: questions.filter((q) => q.section === section),
    }));
  };

  const checkAudioAvailability = async (questionIndex: number) => {
    if (!user?.id) return;

    const stateKey = `question-${questionIndex}`;
    setAudioStates((prev) => ({
      ...prev,
      [stateKey]: { loading: true, hasAudio: false },
    }));

    try {
      const response = await fetch(
        `/api/audio/${user.id}/${questionIndex + 1}`,
      );
      const hasAudio = response.ok && (await response.blob()).size > 0;

      setAudioStates((prev) => ({
        ...prev,
        [stateKey]: { loading: false, hasAudio },
      }));
    } catch (error) {
      console.error(
        `Error checking audio for question ${questionIndex}:`,
        error,
      );
      setAudioStates((prev) => ({
        ...prev,
        [stateKey]: { loading: false, hasAudio: false },
      }));
    }
  };

  useEffect(() => {
    expandedQuestions.forEach((questionIndex) => {
      checkAudioAvailability(questionIndex);
    });
  }, [expandedQuestions, user?.id]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      {getQuestionsBySection().map((section, sectionIndex) => (
        <div key={section.section} className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-400">
            {section.section}
          </h2>
          <div className="space-y-2">
            {section.questions.map((question, questionIndex) => {
              const index = questions.findIndex(
                (q) => q.text === question.text,
              );
              const stateKey = `question-${index}`;
              const audioState = audioStates[stateKey] || {
                loading: false,
                hasAudio: false,
              };

              return (
                <div
                  key={index}
                  className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50"
                >
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-slate-200">
                      Question {index + 1}: {question.text}
                    </span>
                    {expandedQuestions.includes(index) ? (
                      <ChevronDownIcon className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                    )}
                  </button>

                  {expandedQuestions.includes(index) && (
                    <div className="px-6 py-4 border-t border-slate-700">
                      <div className="p-4 bg-slate-700/30 rounded-lg">
                        <AudioPlayer 
                          key={`audio-${index}-${user?.id || 'guest'}`} 
                          src={`/api/audio/${user?.id?.toLowerCase()}/${index + 1}`}
                          questionIndex={index + 1}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
