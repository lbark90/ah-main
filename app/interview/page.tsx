"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "../../lib/context/UserContext";
import { useInterview } from "../../lib/context/InterviewContext";
import InterviewRecorder from "../../components/audio/InterviewRecorder";
import Modal from "../../components/Modal";

interface Question {
  section: string;
  text: string;
}

const questions: Question[] = [
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
    text: "Share a story about your parents or grandparents that influenced you deeply",
  },
  {
    section: "Life Overview",
    text: "Share a story about a family tradition that meant a lot to you.",
  },
  {
    section: "Life Overview",
    text: "Share a story about a time your felt most at peace with your life",
  },
  {
    section: "Life Overview",
    text: "Share a story about a life lesson you learned the hard way.",
  },
  {
    section: "Life Overview",
    text: "Share a story about Something you're most proud of in your life.",
  },
  {
    section: "Life Overview",
    text: "Share a stroy about your biggest regret.",
  },
  {
    section: "Life Overview",
    text: "Share a story about a moment when you felt truly happy.",
  },
  {
    section: "Life Overview",
    text: "Share a story about your closest childhood friend and what you did together.",
  },

  // Childhood and Family Life
  {
    section: "Childhood and Family Life",
    text: "What role did play and imagination have in your childhood?",
  },
  {
    section: "Childhood and Family Life",
    text: "Who was your favorite teacher or mentor as a child, and how did they influence you?",
  },
  {
    section: "Childhood and Family Life",
    text: "What did you fear most as a child, and how did you overcome it?",
  },
  {
    section: "Childhood and Family Life",
    text: "Can you describe the neighborhood where you grew up?",
  },
  {
    section: "Childhood and Family Life",
    text: "What was the mischievous thing you ever did as a kid?",
  },
  {
    section: "Childhood and Family Life",
    text: "Share a story about your siblings, if you had any.",
  },
  {
    section: "Childhood and Family Life",
    text: "Share a story about a family meal that stands out in your memory.",
  },
  {
    section: "Childhood and Family Life",
    text: "Share a story about your children, grandchildren or niece's or nephew's that fills you with pride.",
  },
  {
    section: "Childhood and Family Life",
    text: "Share a story about a family pet and what it meant to you.",
  },
  {
    section: "Childhood and Family Life",
    text: "Share a story about how you celebrated birthdays with your family.",
  },

  // Love and Relationships
  {
    section: "Love and Relationships",
    text: "What qualities did you most admire in your romantic partners?",
  },
  {
    section: "Love and Relationships",
    text: "Share a story about a time you fell in love.",
  },
  {
    section: "Love and Relationships",
    text: "Share a story about your wedding day or the first big love of your life.",
  },
  {
    section: "Love and Relationships",
    text: "How did you navigate conflicts in your relationships?",
  },
  {
    section: "Love and Relationships",
    text: "Share a story about a misunderstanding with someone you loved and how it was resolved.",
  },
  {
    section: "Love and Relationships",
    text: "What role has forgiveness played in your relationships?",
  },
  {
    section: "Love and Relationships",
    text: "Share a story about an unexpected joy in your relationship.",
  },
  {
    section: "Love and Relationships",
    text: "What advice would you give someone entering into a new relationship?",
  },
  {
    section: "Love and Relationships",
    text: "Share a story about a time your heart was broken and how you healed.",
  },
  {
    section: "Love and Relationships",
    text: "How do you want to be remembered by those you loved?",
  },

  // Success, Failure and Personal Growth
  {
    section: "Success, Failure and Personal Growth",
    text: "Share a story about a personal accomplishment you're most proud of.",
  },
  {
    section: "Success, Failure and Personal Growth",
    text: "Share a story about a failure you experienced and how you overcame it.",
  },
  {
    section: "Success, Failure and Personal Growth",
    text: "Share a story about your biggest career success.",
  },
  {
    section: "Success, Failure and Personal Growth",
    text: "Share a story about a time you took a big risk.",
  },
  {
    section: "Success, Failure and Personal Growth",
    text: "Share a story about how you handled criticism or rejection.",
  },
  {
    section: "Success, Failure and Personal Growth",
    text: "How have you changed your mind about something significant in your life?",
  },
  {
    section: "Success, Failure and Personal Growth",
    text: "What's the most profound insight you've gained about life?",
  },
  {
    section: "Success, Failure and Personal Growth",
    text: "How did you learn the value of kindness?",
  },
  {
    section: "Success, Failure and Personal Growth",
    text: "How did failure shape your understanding of success?",
  },
  {
    section: "Success, Failure and Personal Growth",
    text: "What's the hardest truth you've ever had to accept?",
  },

  // Work, Career and Business
  {
    section: "Work, Career and Business",
    text: "What did you enjoy most about the work you did?",
  },
  {
    section: "Work, Career and Business",
    text: "Share a story about your first job and what you learned from it.",
  },
  {
    section: "Work, Career and Business",
    text: "Share a story about a mentor who influenced your career.",
  },
  {
    section: "Work, Career and Business",
    text: "What challenges did you face as a leader or team member?",
  },
  {
    section: "Work, Career and Business",
    text: "How did your work-life balance evolve over time?",
  },
  {
    section: "Work, Career and Business",
    text: "What was your most significant career decision?",
  },
  {
    section: "Work, Career and Business",
    text: "Share a story about a tough work situation you handled well.",
  },
  {
    section: "Work, Career and Business",
    text: "How did you inspire others in the workplace?",
  },
  {
    section: "Work, Career and Business",
    text: "What advice would you give to someone starting in your profession?",
  },
  {
    section: "Work, Career and Business",
    text: "What is something you worked on that made a lasting impact?",
  },

  // Spirituality, Beliefs and Philosophy
  {
    section: "Spirituality, Beliefs and Philosophy",
    text: "What do you think happens after we die?",
  },
  {
    section: "Spirituality, Beliefs and Philosophy",
    text: "How do you find peace during times of uncertainty?",
  },
  {
    section: "Spirituality, Beliefs and Philosophy",
    text: "What spiritual or philosophical beliefs guided your life",
  },
  {
    section: "Spirituality, Beliefs and Philosophy",
    text: "How did your beliefs evolve over time?",
  },
  {
    section: "Spirituality, Beliefs and Philosophy",
    text: "Share a story about a moment when you felt connected to something greater than yourself.",
  },
  {
    section: "Spirituality, Beliefs and Philosophy",
    text: "What personal rituals or practices brought you the most comfort?",
  },
  {
    section: "Spirituality, Beliefs and Philosophy",
    text: "What role has gratitude played in your life? ",
  },
  {
    section: "Spirituality, Beliefs and Philosophy",
    text: "How do you define wisdom?",
  },
  {
    section: "Spirituality, Beliefs and Philosophy",
    text: "What advice would you give about finding meaning in life?",
  },
  {
    section: "Spirituality, Beliefs and Philosophy",
    text: "What do you believe is the meaning of life?",
  },

  // Hobbies, Interests and Passions
  {
    section: "Hobbies, Interests and Passions",
    text: "What hobbies or interests brought you the most joy?",
  },
  {
    section: "Hobbies, Interests and Passions",
    text: "How did you discover your favorite pastime?",
  },
  {
    section: "Hobbies, Interests and Passions",
    text: "Share a story about a creative project you were especially proud of.",
  },
  {
    section: "Hobbies, Interests and Passions",
    text: "What role did music, art, or literature play in your life?",
  },
  {
    section: "Hobbies, Interests and Passions",
    text: "Share a story about a time your passion brought you joy.",
  },
  {
    section: "Hobbies, Interests and Passions",
    text: "What's a skill or talent you developed that others may not know about?",
  },
  {
    section: "Hobbies, Interests and Passions",
    text: "Can you share a story about how your expressed your creativity?",
  },
  {
    section: "Hobbies, Interests and Passions",
    text: "How did you use your hobbies to connect with others?",
  },
  {
    section: "Hobbies, Interests and Passions",
    text: "What's a competition or event you participated in that stood out?",
  },
  {
    section: "Hobbies, Interests and Passions",
    text: "If you could write a book about your life, what would the title be?",
  },

  //Adversity, Resilience, and Lessons Learned
  {
    section: "Adversity, Resilience, and Lessons Learned",
    text: "Share a story about the hardest loss you ever faced.",
  },
  {
    section: "Adversity, Resilience, and Lessons Learned",
    text: "How did you stay hopeful during difficult times?.",
  },
  {
    section: "Adversity, Resilience, and Lessons Learned",
    text: "Can you share a story about a time you were underestimated?",
  },
  {
    section: "Adversity, Resilience, and Lessons Learned",
    text: "What was the toughest decision you ever had to make?",
  },
  {
    section: "Adversity, Resilience, and Lessons Learned",
    text: "How did you bounce back from a major setback?",
  },
  {
    section: "Adversity, Resilience, and Lessons Learned",
    text: "How did humor help you through tough times?",
  },
  {
    section: "Adversity, Resilience, and Lessons Learned",
    text: "What was the most unexpected thing you've ever done?",
  },
  {
    section: "Adversity, Resilience, and Lessons Learned",
    text: "Share a story about finding strength when you needed it most.",
  },
  {
    section: "Adversity, Resilience, and Lessons Learned",
    text: "What was an unexpected event that turned out to be a blessing?",
  },
  {
    section: "Adversity, Resilience, and Lessons Learned",
    text: "What's a question you wish people would ask you?",
  },

  //Life Legacy and Impact
  {
    section: "Life Legacy and Impact",
    text: "How would you like your family to celebrate your memory?",
  },
  {
    section: "Life Legacy and Impact",
    text: "What traditions would you like to see carried on after you're gone?",
  },
  {
    section: "Life Legacy and Impact",
    text: "What's the most important lesson you want future generations to learn?",
  },
  {
    section: "Life Legacy and Impact",
    text: "How do you think your story will inspire others?",
  },
  {
    section: "Life Legacy and Impact",
    text: "What would you say to someone living 100 years from now?",
  },
  {
    section: "Life Legacy and Impact",
    text: "What legacy do you hope to leave behind?",
  },
  {
    section: "Life Legacy and Impact",
    text: "How would you summarize your journey in one sentence?",
  },
  {
    section: "Life Legacy and Impact",
    text: "What's something you wish you'd done differently?",
  },
  {
    section: "Life Legacy and Impact",
    text: "How would you define a 'good life'?",
  },
  {
    section: "Life Legacy and Impact",
    text: "What's the most beautiful thing you've ever experienced?",
  },

  //Final Reflections
  {
    section: "Final Reflections",
    text: "What's a story you've never told anyone before?",
  },
  {
    section: "Final Reflections",
    text: "What's a single word that sums up your life?",
  },
  {
    section: "Final Reflections",
    text: "How do you think others see you, and do you agree?",
  },
  {
    section: "Final Reflections",
    text: "What's a dream you pursued just for fun?",
  },
  {
    section: "Final Reflections",
    text: "What advancements do you wish you could have lived to see?",
  },
  {
    section: "Final Reflections",
    text: "If you had unlimited time and resources, what would you have loved to do?",
  },
  {
    section: "Final Reflections",
    text: "What's the funniest thing that ever happened to you?",
  },
  {
    section: "Final Reflections",
    text: "How did you reconcile the past with the present?",
  },
  {
    section: "Final Reflections",
    text: "What's the best piece of advice you've ever given?",
  },
  {
    section: "Final Reflections",
    text: "What question do you think I should have asked, and how would you answer it?",
  },
];

export default function Interview() {
  const { user } = useUser();
  const router = useRouter();
  const {
    currentSession,
    startNewSession,
    getCurrentQuestionRecording,
    goToNextQuestion,
    goToPreviousQuestion,
    recordings,
    completeSession,
  } = useInterview();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showSkipModal, setShowSkipModal] = useState(false);

  useEffect(() => {
    if (!user || !currentSession) {
      const fetchRecordings = async () => {
        try {
          const response = await fetch(
            `/api/storage/list?user=${encodeURIComponent(user?.email)}`,
          );

          if (!response.ok) {
            throw new Error("Failed to fetch recordings");
          }

          const files = await response.json();
          startNewSession(files);
        } catch (error) {
          console.error("Error:", error);
          startNewSession([]);
        }
      };

      fetchRecordings();
    }
  }, [user, currentSession, startNewSession]);

  if (!currentSession || !questions) return null;

  const currentRecording = getCurrentQuestionRecording();
  const currentQuestionIndex = currentSession?.questionIndex || 0;

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      goToNextQuestion();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      goToPreviousQuestion();
    }
  };

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleSubmit = async () => {
    if (!currentSession?.recordings || !user) return;

    try {
      for (const recording of currentSession.recordings) {
        if (recording && recording.audioUrl) {
          const response = await fetch(recording.audioUrl);
          const blob = await response.blob();

          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");
          formData.append("questionIndex", String(recording.questionIndex + 1));
          formData.append("userName", `${user.firstName}_${user.lastName}`);

          const uploadResponse = await fetch("/api/storage/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload recording");
          }
        }
      }

      router.push("/success");
    } catch (error) {
      console.error("Error processing recordings:", error);
    }
  };

  return (
    <div className="interview-container">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800/50 p-8 rounded-lg border border-slate-700 mb-8">
            <h1 className="text-3xl font-light mb-6 text-center">
              Your Life Story Interview
            </h1>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl text-blue-400">Current Question:</h2>
                <span className="text-slate-400">
                  {questions.length - currentSession.questionIndex - 1}{" "}
                  questions remaining
                </span>
              </div>
              <h3 className="text-xl text-blue-300 mb-2">
                {questions[currentSession.questionIndex].section}
              </h3>
              <p className="text-2xl font-light">
                {questions[currentSession.questionIndex].text}
              </p>
            </div>

            <InterviewRecorder questionIndex={currentSession.questionIndex} />

            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentSession.questionIndex === 0}
                className="px-6 py-2 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous Question
              </button>
              <button
                onClick={() => setShowSkipModal(true)}
                className="px-6 py-2 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
              >
                Skip to End
              </button>
              <Modal
                isOpen={showSkipModal}
                onClose={() => setShowSkipModal(false)}
                onConfirm={() => {
                  setShowSkipModal(false);
                  completeSession();
                  router.push("/success");
                }}
                title="Skip to End"
                message="Are you sure you want to skip to the end? Any unrecorded answers will be left blank."
              />
              {currentSession.questionIndex === questions.length - 1 ? (
                <button
                  onClick={() =>
                    router.push(
                      `/api/audio/${user?.id || user?.username || user?.email}/${currentSession.questionIndex + 1}`,
                    )
                  }
                  className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-md transition-colors"
                >
                  Submit Answers
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={
                    currentSession.questionIndex === questions.length - 1
                  }
                  className="px-6 py-2 rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
