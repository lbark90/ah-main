'use client';

import { useState } from 'react';
// Using Unicode characters instead of icons for simplicity
const ChevronDownIcon = () => <span className="text-lg">▼</span>;
const ChevronRightIcon = () => <span className="text-lg">▶</span>;
import Modal from '../../components/Modal';
import { useUser } from '../../lib/context/UserContext';

const questions = [
  // Life Overview
  { section: "Life Overview", text: "Share a story about your earliest memory." },
  { section: "Life Overview", text: "Share a story about where you grew up and what it was like." },
  { section: "Life Overview", text: "Share a story about your parents or grandparents that influenced you deeply" },
  { section: "Life Overview", text: "Share a story about a family tradition that meant a lot to you." },
  { section: "Life Overview", text: "Share a story about a time your felt most at peace with your life" },
  { section: "Life Overview", text: "Share a story about a life lesson you learned the hard way." },
  { section: "Life Overview", text: "Share a story about Something you're most proud of in your life." },
  { section: "Life Overview", text: "Share a stroy about your biggest regret." },
  { section: "Life Overview", text: "Share a story about a moment when you felt truly happy." },
  { section: "Life Overview", text: "Share a story about your closest childhood friend and what you did together." },

  // Childhood and Family Life
  { section: "Childhood and Family Life", text: "What role did play and imagination have in your childhood?" },
  { section: "Childhood and Family Life", text: "Who was your favorite teacher or mentor as a child, and how did they influence you?" },
  { section: "Childhood and Family Life", text: "What did you fear most as a child, and how did you overcome it?" },
  { section: "Childhood and Family Life", text: "Can you describe the neighborhood where you grew up?" },
  { section: "Childhood and Family Life", text: "What was the mischievous thing you ever did as a kid?" },
  { section: "Childhood and Family Life", text: "Share a story about your siblings, if you had any." },
  { section: "Childhood and Family Life", text: "Share a story about a family meal that stands out in your memory." },
  { section: "Childhood and Family Life", text: "Share a story about your children, grandchildren or niece's or nephew's that fills you with pride." },
  { section: "Childhood and Family Life", text: "Share a story about a family pet and what it meant to you." },
  { section: "Childhood and Family Life", text: "Share a story about how you celebrated birthdays with your family." },

  // Love and Relationships
  { section: "Love and Relationships", text: "What qualities did you most admire in your romantic partners?" },
  { section: "Love and Relationships", text: "Share a story about a time you fell in love." },
  { section: "Love and Relationships", text: "Share a story about your wedding day or the first big love of your life." },
  { section: "Love and Relationships", text: "How did you navigate conflicts in your relationships?" },
  { section: "Love and Relationships", text: "Share a story about a misunderstanding with someone you loved and how it was resolved." },
  { section: "Love and Relationships", text: "What role has forgiveness played in your relationships?" },
  { section: "Love and Relationships", text: "Share a story about an unexpected joy in your relationship." },
  { section: "Love and Relationships", text: "What advice would you give someone entering into a new relationship?" },
  { section: "Love and Relationships", text: "Share a story about a time your heart was broken and how you healed." },
  { section: "Love and Relationships", text: "How do you want to be remembered by those you loved?" },

  // Success, Failure and Personal Growth
  { section: "Success, Failure and Personal Growth", text: "Share a story about a personal accomplishment you're most proud of." },
  { section: "Success, Failure and Personal Growth", text: "Share a story about a failure you experienced and how you overcame it." },
  { section: "Success, Failure and Personal Growth", text: "Share a story about your biggest career success." },
  { section: "Success, Failure and Personal Growth", text: "Share a story about a time you took a big risk." },
  { section: "Success, Failure and Personal Growth", text: "Share a story about how you handled criticism or rejection." },
  { section: "Success, Failure and Personal Growth", text: "How have you changed your mind about something significant in your life?" },
  { section: "Success, Failure and Personal Growth", text: "What's the most profound insight you've gained about life?" },
  { section: "Success, Failure and Personal Growth", text: "How did you learn the value of kindness?" },
  { section: "Success, Failure and Personal Growth", text: "How did failure shape your understanding of success?" },
  { section: "Success, Failure and Personal Growth", text: "What's the hardest truth you've ever had to accept?" },

  // Work, Career and Business
  { section: "Work, Career and Business", text: "What did you enjoy most about the work you did?" },
  { section: "Work, Career and Business", text: "Share a story about your first job and what you learned from it." },
  { section: "Work, Career and Business", text: "Share a story about a mentor who influenced your career." },
  { section: "Work, Career and Business", text: "What challenges did you face as a leader or team member?" },
  { section: "Work, Career and Business", text: "How did your work-life balance evolve over time?" },
  { section: "Work, Career and Business", text: "What was your most significant career decision?" },
  { section: "Work, Career and Business", text: "Share a story about a tough work situation you handled well." },
  { section: "Work, Career and Business", text: "How did you inspire others in the workplace?" },
  { section: "Work, Career and Business", text: "What advice would you give to someone starting in your profession?" },
  { section: "Work, Career and Business", text: "What is something you worked on that made a lasting impact?" },

  // Spirituality, Beliefs and Philosophy
  { section: "Spirituality, Beliefs and Philosophy", text: "What do you think happens after we die?" },
  { section: "Spirituality, Beliefs and Philosophy", text: "How do you find peace during times of uncertainty?" },
  { section: "Spirituality, Beliefs and Philosophy", text: "What spiritual or philosophical beliefs guided your life" },
  { section: "Spirituality, Beliefs and Philosophy", text: "How did your beliefs evolve over time?" },
  { section: "Spirituality, Beliefs and Philosophy", text: "Share a story about a moment when you felt connected to something greater than yourself." },
  { section: "Spirituality, Beliefs and Philosophy", text: "What personal rituals or practices brought you the most comfort?" },
  { section: "Spirituality, Beliefs and Philosophy", text: "What role has gratitude played in your life? " },
  { section: "Spirituality, Beliefs and Philosophy", text: "How do you define wisdom?" },
  { section: "Spirituality, Beliefs and Philosophy", text: "What advice would you give about finding meaning in life?" },
  { section: "Spirituality, Beliefs and Philosophy", text: "What do you believe is the meaning of life?" },

  // Hobbies, Interests and Passions
  { section: "Hobbies, Interests and Passions", text: "What hobbies or interests brought you the most joy?" },
  { section: "Hobbies, Interests and Passions", text: "How did you discover your favorite pastime?" },
  { section: "Hobbies, Interests and Passions", text: "Share a story about a creative project you were especially proud of." },
  { section: "Hobbies, Interests and Passions", text: "What role did music, art, or literature play in your life?" },
  { section: "Hobbies, Interests and Passions", text: "Share a story about a time your passion brought you joy." },
  { section: "Hobbies, Interests and Passions", text: "What's a skill or talent you developed that others may not know about?" },
  { section: "Hobbies, Interests and Passions", text: "Can you share a story about how your expressed your creativity?" },
  { section: "Hobbies, Interests and Passions", text: "How did you use your hobbies to connect with others?" },
  { section: "Hobbies, Interests and Passions", text: "What's a competition or event you participated in that stood out?" },
  { section: "Hobbies, Interests and Passions", text: "If you could write a book about your life, what would the title be?" },

  //Adversity, Resilience, and Lessons Learned
  { section: "Adversity, Resilience, and Lessons Learned", text: "Share a story about the hardest loss you ever faced." },
  { section: "Adversity, Resilience, and Lessons Learned", text: "How did you stay hopeful during difficult times?." },
  { section: "Adversity, Resilience, and Lessons Learned", text: "Can you share a story about a time you were underestimated?" },
  { section: "Adversity, Resilience, and Lessons Learned", text: "What was the toughest decision you ever had to make?" },
  { section: "Adversity, Resilience, and Lessons Learned", text: "How did you bounce back from a major setback?" },
  { section: "Adversity, Resilience, and Lessons Learned", text: "How did humor help you through tough times?" },
  { section: "Adversity, Resilience, and Lessons Learned", text: "What was the most unexpected thing you've ever done?" },
  { section: "Adversity, Resilience, and Lessons Learned", text: "Share a story about finding strength when you needed it most." },
  { section: "Adversity, Resilience, and Lessons Learned", text: "What was an unexpected event that turned out to be a blessing?" },
  { section: "Adversity, Resilience, and Lessons Learned", text: "What's a question you wish people would ask you?" },

  //Life Legacy and Impact
  { section: "Life Legacy and Impact", text: "How would you like your family to celebrate your memory?" },
  { section: "Life Legacy and Impact", text: "What traditions would you like to see carried on after you're gone?" },
  { section: "Life Legacy and Impact", text: "What's the most important lesson you want future generations to learn?" },
  { section: "Life Legacy and Impact", text: "How do you think your story will inspire others?" },
  { section: "Life Legacy and Impact", text: "What would you say to someone living 100 years from now?" },
  { section: "Life Legacy and Impact", text: "What legacy do you hope to leave behind?" },
  { section: "Life Legacy and Impact", text: "How would you summarize your journey in one sentence?" },
  { section: "Life Legacy and Impact", text: "What's something you wish you'd done differently?" },
  { section: "Life Legacy and Impact", text: "How would you define a 'good life'?" },
  { section: "Life Legacy and Impact", text: "What's the most beautiful thing you've ever experienced?" },

  //Final Reflections
  { section: "Final Reflections", text: "What's a story you've never told anyone before?" },
  { section: "Final Reflections", text: "What's a single word that sums up your life?" },
  { section: "Final Reflections", text: "How do you think others see you, and do you agree?" },
  { section: "Final Reflections", text: "What's a dream you pursued just for fun?" },
  { section: "Final Reflections", text: "What advancements do you wish you could have lived to see?" },
  { section: "Final Reflections", text: "If you had unlimited time and resources, what would you have loved to do?" },
  { section: "Final Reflections", text: "What's the funniest thing that ever happened to you?" },
  { section: "Final Reflections", text: "How did you reconcile the past with the present?" },
  { section: "Final Reflections", text: "What's the best piece of advice you've ever given?" },
  { section: "Final Reflections", text: "What question do you think I should have asked, and how would you answer it?" }
];

export default function RecordingsPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [currentAudio, setCurrentAudio] = useState<{
    questionIndex: number;
    title: string;
    audioUrl: string | null;
    isLoading: boolean;
    error: string | null;
  } | null>(null);
  const { user } = useUser();

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handlePlayAudio = async (questionIndex: number, questionText: string) => {
    if (!user) {
      console.error("No user found");
      return;
    }

    const userName = user.userId || user.id || (user.email ? user.email.split('@')[0] : null);

    if (!userName) {
      console.error("Could not determine user identifier");
      return;
    }

    const audioUrl = `/api/audio/${encodeURIComponent(userName)}/${questionIndex + 1}`;

    setCurrentAudio({
      questionIndex,
      title: questionText,
      audioUrl: null,
      isLoading: true,
      error: null
    });

    try {
      const response = await fetch(audioUrl);
      
      if (!response.ok) {
        throw new Error(response.status === 404 
          ? 'You haven\'t recorded an answer for this question yet.' 
          : `Error fetching audio (${response.status})`);
      }

      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        throw new Error('Audio file is empty');
      }
      
      const objectUrl = URL.createObjectURL(audioBlob);

      setCurrentAudio(prev => 
        prev ? {
          ...prev,
          audioUrl: objectUrl,
          isLoading: false
        } : null
      );
    } catch (error) {
      console.error("Error fetching audio:", error);
      setCurrentAudio(prev => 
        prev ? {
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load audio',
          isLoading: false
        } : null
      );
    }
  };

  const sections = Array.from(new Set(questions.map(q => q.section)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-light mb-8 text-center text-white">Your Recordings</h1>

        <div className="space-y-6">
          {sections.map(section => (
            <div key={section} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <button
                onClick={() => toggleSection(section)}
                className="w-full flex items-center justify-between text-left p-2 hover:bg-slate-700/50 rounded-md transition-colors"
              >
                <h2 className="text-xl font-light text-blue-400">{section}</h2>
                {expandedSections.includes(section) ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </button>

              {expandedSections.includes(section) && (
                <div className="mt-4 space-y-3">
                  {questions
                    .filter(q => q.section === section)
                    .map((question, idx) => {f
                      const questionIndex = questions.findIndex(q => q.text === question.text);
                      return (
                        <div key={idx} className="bg-slate-700/30 p-4 rounded-md">
                          <div className="flex justify-between items-center">
                            <p className="text-slate-200">{question.text}</p>
                            <button
                              onClick={() => handlePlayAudio(questionIndex, question.text)}
                              className="ml-4 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                            >
                              Play
                            </button>
                          </div>
                          {currentAudio?.questionIndex === questionIndex && (
                            <div className="mt-2 ml-4">
                              {currentAudio.isLoading ? (
                                <div className="flex items-center justify-center p-2 text-slate-400">
                                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Loading audio...
                                </div>
                              ) : currentAudio.error ? (
                                <div className="text-slate-400 p-2">{currentAudio.error}</div>
                              ) : currentAudio.audioUrl ? (
                                <audio src={currentAudio.audioUrl} controls className="w-full mt-2" autoPlay />
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}