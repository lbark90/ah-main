"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../lib/context/UserContext";
import { useAssistant } from "../../lib/context/AssistantContext";
import { motion } from "framer-motion";

type PulsingCircleProps = {
  isSpeaking: boolean;
  size?: number;
  colorClass?: string;
};

const PulsingCircle: React.FC<PulsingCircleProps> = ({
  isSpeaking,
  size = 128,
  colorClass = "bg-blue-500",
}) => {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <motion.div
        initial={{ scale: 1, opacity: 0.6 }}
        animate={
          isSpeaking
            ? { scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }
            : { scale: 1, opacity: 0.6 }
        }
        transition={
          isSpeaking
            ? { duration: 1, ease: "easeOut", repeat: Infinity }
            : { duration: 0 }
        }
        className={`absolute rounded-full ${colorClass}`}
        style={{ width: size, height: size }}
      />
      <div
        className={`relative rounded-full ${colorClass}`}
        style={{ width: size * 0.2, height: size * 0.2 }}
      />
    </div>
  );
};

interface ConversationUIProps {
  userName?: string;
  memorializedName?: string;
  onConversationEnd?: () => void;
  userDob?: string; // Add DOB prop
}

interface MessageItem {
  text: string;
  sender: string;
  timestamp: Date;
  isTyping?: boolean;
  visibleText?: string;
}

interface UserProfileInfo {
  firstName?: string;
  lastName?: string;
  dob?: string;
  profileDocument?: string; // Path to profile document file only
}

export default function ConversationUI({
  userName = "User",
  memorializedName = "Sarah Johnson",
  onConversationEnd,
  userDob = "", // Add DOB parameter with default value
}: ConversationUIProps) {
  const router = useRouter();
  const { user } = useUser();
  const { assistant, conversation, isLoading: isAssistantLoading } = useAssistant();

  useEffect(() => {
    if (!user || !user.id) {
      console.log("No user logged in, redirecting to login page");
      router.push("/login");
    }
  }, [user, router]);

  const isMounted = useRef(true);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [userStartedConversation, setUserStartedConversation] = useState(false);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [userProfileInfo, setUserProfileInfo] = useState<UserProfileInfo>({});

  // WebSocket and audio specific refs from debug client
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const userIdRef = useRef<string>(user?.id || `user_${Date.now()}`);
  // Refs to track latest finalResults and interimResult
  const finalResultsRef = useRef<string[]>([]);
  const interimResultRef = useRef<string>("");
  // Ref for last text chunk for TTS fallback
  const lastTextChunkRef = useRef<string>("");
  // Flag to track if any real audio chunks were received
  const hasAudioRef = useRef<boolean>(false);
  
  // Speech recognition states from debug client
  const [transcript, setTranscript] = useState("");
  const [interimResult, setInterimResult] = useState("");
  const [finalResults, setFinalResults] = useState<string[]>([]);
  const [transcriptSent, setTranscriptSent] = useState(false);

  // Sync refs with state
  useEffect(() => {
    finalResultsRef.current = finalResults;
  }, [finalResults]);

  useEffect(() => {
    interimResultRef.current = interimResult;
  }, [interimResult]);
  
  // Microphone permission state
  const [micPermissionChecked, setMicPermissionChecked] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  
  // Additional variables from debug client
  const [isPlaying, setIsPlaying] = useState(false);
  const [isServerPlaying, setIsServerPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const pendingAudioChunks = useRef<any[]>([]);
  const isProcessingAudio = useRef(false);
  const interruptionInProgress = useRef(false);
  const lastUserInterruptTime = useRef(0);
  const INTERRUPTION_THRESHOLD = 5000; // 5 seconds threshold

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isSocketInitializing = useRef(false);

  const messageHandlerAttached = useRef(false);
  const requestIdCounter = useRef(0);
  const processedMessageIds = useRef(new Set<string>());
  const processedMessageContents = useRef(new Set<string>());
  const pendingRequests = useRef(new Map<string, string>());

  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const DEBUG_MODE = false;

  const connectionAttemptsRef = useRef(0);
  const MAX_CONNECTION_ATTEMPTS = 3;
  const lastConnectionAttemptRef = useRef(0);
  const CONNECTION_COOLDOWN = 10000; // 10 seconds between connection attempts
  const mountCountRef = useRef(0);

  // Initialize audio context
  const initAudio = () => {
    if (!audioContextRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
          console.log("Audio context initialized successfully");
          
          if (audioContextRef.current.state === "suspended") {
            console.log("Audio context is suspended - this is normal, will resume on user interaction");
          }
          return true;
        } else {
          console.error("Web Audio API not supported in this browser");
          return false;
        }
      } catch (e) {
        console.error(`Error initializing audio context: ${e instanceof Error ? e.message : e}`);
        return false;
      }
    } else {
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current
          .resume()
          .then(() => {
            console.log("Existing audio context resumed");
          })
          .catch((err) => {
            console.error(`Error resuming existing audio context: ${err.message}`);
          });
      }
      return true;
    }
  };

  // Check microphone permission
  const checkMicrophonePermission = async () => {
    if (micPermissionChecked && micStreamRef.current) {
      console.log("Microphone already initialized");
      return micStreamRef.current;
    }

    console.log("Requesting microphone permission...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone access granted");
      setMicPermissionChecked(true);
      micStreamRef.current = stream;

      // Test the microphone by analyzing audio level briefly
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Check audio level once
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        console.log(`Microphone test - audio level: ${Math.round(average)}`);

        // Clean up test
        microphone.disconnect();
        setTimeout(() => audioContext.close(), 500);
      } catch (e) {
        console.error(`Microphone test error: ${e instanceof Error ? e.message : e}`);
      }

      return stream;
    } catch (err) {
      console.error(`❌ Microphone access error: ${err instanceof Error ? err.message : err}`);
      setMicPermissionChecked(true);
      return null;
    }
  };

  // Start push-to-talk speech recognition
  const startPushToTalk = () => {
    setTranscriptSent(false);
    console.log("Starting push-to-talk speech recognition");

    // Reset transcript and state
    setTranscript("");
    setInterimResult("");
    setFinalResults([]);
    setIsListening(true);

    // First initialize the microphone
    checkMicrophonePermission()
      .then(() => {
        // Now initialize speech recognition
        try {
          const SpeechRecognition =
            window.SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (!SpeechRecognition) {
            throw new Error("Speech recognition not supported in this browser");
          }

          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;

          // Critical for Chrome - these settings make it more reliable
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = "en-US";
          recognition.maxAlternatives = 1;

          // Set up handlers
          recognition.onstart = function () {
            console.log("Speech recognition started");
            setIsListening(true);
          };

          recognition.onerror = function (event) {
            console.error(`Speech recognition error: ${event.error}`);
            setIsListening(false);
          };

          recognition.onresult = function (event) {
            let interimText = "";
            let finalText = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;

              if (event.results[i].isFinal) {
                finalText += transcript;
                console.log(`Speech recognition final result: "${transcript}"`);
                // Store this final result as an atomic operation
                const newResult = transcript;
                setFinalResults(prev => {
                  const updated = [...prev, newResult];
                  console.log(`Updated finalResults: [${updated.join(', ')}]`);
                  return updated;
                });
              } else {
                interimText += transcript;
              }
            }

            // Update state - use functional updates to ensure we have the latest state
            if (interimText) {
              console.log(`Speech recognition interim result: "${interimText}"`);
              setInterimResult(interimText);
            }
            
            if (finalText) {
              console.log(`Adding final text to transcript: "${finalText}"`);
              setTranscript(prev => {
                const newTranscript = (prev ? prev + " " : "") + finalText;
                console.log(`Updated transcript: "${newTranscript}"`);
                return newTranscript;
              });
            }
          };

          recognition.onend = function () {
            console.log("Speech recognition ended");
            setIsListening(false);

            // If we have a pending interim result when recognition ends, add it to the final transcript
            if (interimResult) {
              setFinalResults(prev => [...prev, interimResult]);
              setTranscript(prev => prev + " " + interimResult);
              setInterimResult("");
            }
          };

          // Start recognition
          recognition.start();
          console.log("Speech recognition API initialized and started");
        } catch (e) {
          console.error(`Error initializing speech recognition: ${e instanceof Error ? e.message : e}`);
          setIsListening(false);
          recognitionRef.current = null;
        }
      })
      .catch((err) => {
        console.error(`Could not initialize microphone: ${err instanceof Error ? err.message : err}`);
        setIsListening(false);
      });
  };

  // Stop push-to-talk and send the transcript
  const stopPushToTalk = () => {
    console.log("Stopping push-to-talk");
    if (transcriptSent) return;

    // Store a reference to the current recognition object
    const currentRecognition = recognitionRef.current;

    // See if recognition is still active
    if (currentRecognition) {
      try {
        console.log("Recognition active: Yes");
        // Stop the recognition
        currentRecognition.stop();
        console.log("Speech recognition stopped");
      } catch (e) {
        console.error(`Error stopping recognition: ${e instanceof Error ? e.message : e}`);
      }
    } else {
      console.log("Recognition active: No");
    }

    // Use a delay to ensure final results are processed
    setTimeout(() => {
      // Use refs to get the latest values
      const combinedText =
        finalResultsRef.current.join(" ").trim() || interimResultRef.current.trim();

      console.log(`Final transcript prepared from finalResults: "${combinedText}"`);

      if (combinedText) {
        if (!transcriptSent) {
          console.log(`Sending transcript: "${combinedText}"`);
          setTranscriptSent(true);
          sendTranscriptMessage(combinedText);
          // Add user message to UI
          setInputText(combinedText);
          handleSendMessage(combinedText);
        } else {
          console.log("Transcript already sent, skipping");
        }
      } else {
        console.log("No speech detected during the session");
      }

      // Clean up
      recognitionRef.current = null;
      setIsListening(false);
    }, 1000); // Increase the delay to ensure all results are processed
  };

  // Send transcript message to server
  const sendTranscriptMessage = (message: string) => {
    if (!message || !message.trim()) {
      console.log("No speech to send");
      return false;
    }

    // Double-check connection status
    const socketObj = socketRef.current;
    const socketReady = socketObj && socketObj.readyState === WebSocket.OPEN;
    
    if (!socketReady) {
      console.error("Cannot send message - socket not connected");
      return false;
    }

    try {
      console.log(`Sending message to server: "${message.trim()}"`);
      socketObj.send(
        JSON.stringify({
          type: "user_message",
          user_id: userIdRef.current,
          message: message.trim(),
          timestamp: Date.now(),
        })
      );
      return true;
    } catch (e) {
      console.error(`Error sending message: ${e instanceof Error ? e.message : e}`);
      return false;
    }
  };

  // Stop all audio playback
  const stopAllAudio = () => {
    console.log("Stopping all audio playback");

    // Track when the interruption happened
    lastUserInterruptTime.current = Date.now();
    interruptionInProgress.current = true;

    // Stop any current audio
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {
        // Ignore errors on stop
      }
      currentAudioSourceRef.current = null;
    }

    // Clear pending chunks
    pendingAudioChunks.current = [];
    isProcessingAudio.current = false;
    setIsServerPlaying(false);
    setIsPlaying(false);
  };

  // Set up push-to-talk keyboard shortcuts
  const setupPushToTalkShortcuts = () => {
    console.log("Setting up push-to-talk shortcuts");

    let isPushToTalkActive = false;
    let startTime = 0;

    // Handle keydown (start talking)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " && !e.repeat) {
        e.preventDefault(); // Prevent page scrolling

        // Don't try to activate if it's already active
        if (isPushToTalkActive) return;

        startTime = Date.now();
        console.log("Spacebar pressed - activating speech input");
        isPushToTalkActive = true;

        // If audio context is suspended, resume it
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }

        // If AI is currently speaking, stop it
        if (isPlaying || isServerPlaying) {
          stopAllAudio();
        }

        // Start speech recognition
        startPushToTalk();
      }
    };

    // Handle keyup (stop talking)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " && isPushToTalkActive) {
        e.preventDefault();

        // Calculate how long the spacebar was held
        const holdTime = Date.now() - startTime;
        console.log(`Spacebar released after ${holdTime}ms - deactivating speech input`);
        isPushToTalkActive = false;

        // Stop recognition and send message
        stopPushToTalk();
      }
    };

    // Clean up existing listeners first to avoid duplicates
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Handle tab/window blur
    window.addEventListener("blur", function () {
      if (isPushToTalkActive) {
        console.log("Window lost focus - stopping speech input");
        isPushToTalkActive = false;
        stopPushToTalk();
      }
    });

    console.log("Push-to-talk shortcuts set up - press and hold SPACEBAR to speak");
    
    // Return cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", function () {
        if (isPushToTalkActive) {
          console.log("Window lost focus - stopping speech input");
          isPushToTalkActive = false;
          stopPushToTalk();
        }
      });
    };
  };

  const handleError = (errorMessage: string) => {
    console.error("Error:", errorMessage);
    setError(errorMessage);
  };

  const handleSocketError = (errorMessage: string | null) => {
    if (errorMessage) {
      console.error("Socket Error:", errorMessage);
      setSocketError(errorMessage);
    } else {
      console.log("Socket error cleared");
      setSocketError(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length) {
      scrollToBottom();
    }
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Update fetchUserProfileInfo to merge prop data with API data
  const fetchUserProfileInfo = async (userId: string): Promise<UserProfileInfo> => {
    try {
      console.log("Fetching profile info for user:", userId);
      
      const userResponse = await fetch(`/api/user/profile?userId=${userId}`);
      if (!userResponse.ok) {
        throw new Error(`Failed to fetch profile info: ${userResponse.status} ${userResponse.statusText}`);
      }
      
      const userData = await userResponse.json();
      console.log("Retrieved user profile info:", userData);
      
      // Merge API data with props data, preferring API data when available
      const profileInfo: UserProfileInfo = {
        firstName: userData.firstName || userName.split(' ')[0] || "",
        lastName: userData.lastName || (userName.split(' ').length > 1 ? userName.split(' ').slice(1).join(' ') : "") || "",
        dob: userData.dob || userDob || "", 
        profileDocument: userData.profileDocumentPath || ""
      };
      
      console.log("Final merged profile info:", profileInfo);
      console.log("Profile document path:", profileInfo.profileDocument);
      setUserProfileInfo(profileInfo);
      return profileInfo;
    } catch (error) {
      console.error("Error fetching user profile info:", error);
      
      // Fallback to props if API fails
      const fallbackInfo: UserProfileInfo = {
        firstName: userName.split(' ')[0] || "",
        lastName: (userName.split(' ').length > 1 ? userName.split(' ').slice(1).join(' ') : "") || "",
        dob: userDob || "",
        profileDocument: ""
      };
      
      console.log("Using fallback profile info:", fallbackInfo);
      setUserProfileInfo(fallbackInfo);
      return fallbackInfo;
    }
  };

  const fetchVoiceId = async (userId: string): Promise<string> => {
    try {
      if (voiceId) {
        console.log("Using cached voice ID:", voiceId);
        return voiceId;
      }

      console.log("Fetching voice ID for user:", userId);
      const response = await fetch(`/api/voice/id?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch voice ID: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      if (!data?.voiceId) {
        throw new Error("No voice ID returned from API");
      }

      console.log("Retrieved voice ID from API:", data.voiceId);
      setVoiceId(data.voiceId);
      return data.voiceId;
    } catch (error) {
      console.error("Error fetching voice ID:", error);
      throw new Error("Failed to get voice ID. Please try again.");
    }
  };

  // Function to fetch login credentials from GCP bucket
  const fetchLoginCredentials = async (userId: string): Promise<UserProfileInfo> => {
    try {
      console.log("Fetching login credentials from GCP bucket for user:", userId);
      const response = await fetch(`/api/user/gcp-login-credentials?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch login credentials: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Retrieved login credentials:", data);

      return {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        dob: data.dateOfBirth || "",
        profileDocument: "", // No profile document in login credentials
      };
    } catch (error) {
      console.error("Error fetching login credentials:", error);
      return {
        firstName: "",
        lastName: "",
        dob: "",
        profileDocument: "",
      };
    }
  };

  // Initialize WebSocket connection
  const initializeSocket = async (userId: string) => {
    if (!isMounted.current) {
      console.log("Component not mounted, skipping socket initialization");
      isSocketInitializing.current = false;
      return;
    }

    if (isSocketInitializing.current && !socketRef.current) {
      console.log("Socket initialization already in progress, waiting...");
      return;
    }
    
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
      console.log("Socket already exists and is not closed, skipping initialization");
      isSocketInitializing.current = false;
      return;
    }

    if (!userId) {
      console.log("No userId provided for socket initialization");
      isSocketInitializing.current = false;
      return;
    }

    const now = Date.now();
    if (now - lastConnectionAttemptRef.current < CONNECTION_COOLDOWN && connectionAttemptsRef.current > 0) {
      console.log(`Connection attempt too soon after previous attempt. Waiting ${CONNECTION_COOLDOWN}ms...`);
      setTimeout(() => {
        if (isMounted.current && !socket && !isSocketInitializing.current) {
          initializeSocket(userId);
        }
      }, CONNECTION_COOLDOWN);
      return;
    }

    if (connectionAttemptsRef.current >= MAX_CONNECTION_ATTEMPTS) {
      console.log(`Maximum connection attempts (${MAX_CONNECTION_ATTEMPTS}) reached. Giving up.`);
      handleSocketError("Maximum connection attempts reached. Please refresh the page.");
      return;
    }
    lastConnectionAttemptRef.current = now;
    connectionAttemptsRef.current += 1;
    console.log(`Connection attempt ${connectionAttemptsRef.current} of ${MAX_CONNECTION_ATTEMPTS}`);
    isSocketInitializing.current = true;

    try {
      console.log("Fetching voice ID and profile info before initializing socket");
      let currentVoiceId: string;
      let profileInfo: UserProfileInfo = {};

      try {
        // Fetch profile info
        const fetchedProfileInfo = await fetchUserProfileInfo(userId);

        profileInfo = {
          profileDocument: fetchedProfileInfo.profileDocument || `${userId}/profile_description/${userId}_memorial_profile.txt`, // Ensure profileDocument is set
        };

        currentVoiceId = await fetchVoiceId(userId);

        if (!currentVoiceId) {
          throw new Error("Could not retrieve a valid voice ID");
        }

        console.log("Final profile info:", profileInfo);
      } catch (fetchError) {
        console.error("Failed to get voice ID or profile info for socket:", fetchError);
        handleSocketError("Configuration issue. Please refresh and try again.");
        isSocketInitializing.current = false;
        return;
      }

      // Use the fixed WebSocket endpoint for localhost
      const socketUrl = "ws://0.0.0.0:8080";
      console.log(`Attempting socket connection to: ${socketUrl} (using fixed localhost endpoint)`);

      const newSocket = new WebSocket(socketUrl);
      socketRef.current = newSocket;
      const connectionTimeout = setTimeout(() => {
        if (newSocket.readyState !== WebSocket.OPEN) {
          console.log("Connection timeout - closing socket");
          newSocket.close();
          isSocketInitializing.current = false;
        }
      }, 5000);

      newSocket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error("Socket error:", error);
        handleSocketError("Connection error occurred");
        isSocketInitializing.current = false;
      };

      newSocket.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`Socket closed with code: ${event.code}, reason: ${event.reason}`);
        setIsConnected(false);
        isSocketInitializing.current = false;

        if (
          event.code !== 1000 &&
          connectionAttemptsRef.current < MAX_CONNECTION_ATTEMPTS
        ) {
          console.log("Abnormal socket closure, will attempt to reconnect");
          setTimeout(() => {
            if (isMounted.current && !socket && !isSocketInitializing.current) {
              console.log("Attempting to reconnect socket...");
              initializeSocket(userId);
            }
          }, CONNECTION_COOLDOWN);
        } else {
          console.log("Socket closed abnormally, but not reconnecting due to max attempts or unmounting");
        }
      };

      // Set up message handler
      newSocket.onmessage = function (event) {
        try {
          console.log("Message received from server");
          const message = JSON.parse(event.data);

          // Log message type for debugging
          console.log(`Message type: ${message.type}`);

          switch (message.type) {
            case "connection_ack":
              console.log("Server acknowledged connection");
              break;

            case "text_chunk":
              if (message.data && message.data.trim()) {
                console.log(`Server response: "${message.data}"`);
              }
              // Store last text for TTS fallback
              lastTextChunkRef.current = message.data.trim();
              break;

            case "audio_chunk":
              // Mark that a real audio chunk arrived
              hasAudioRef.current = true;
              console.log(`Audio response received (chunk ${message.chunk_index || "?"})`);
              
              const audioBase64 = message.audio_data || message.data?.audio || message.data;
              if (!audioBase64 || typeof audioBase64 !== "string" || !/^[A-Za-z0-9+/=]+$/.test(audioBase64.trim())) {
                console.error("Invalid or missing audio base64 string");
                return;
              }
              try {
                if (!audioContextRef.current) {
                  initAudio();
                  if (!audioContextRef.current) {
                    throw new Error("Failed to initialize audio context");
                  }
                }

                const binaryString = window.atob(audioBase64);
                const audioBuffer = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  audioBuffer[i] = binaryString.charCodeAt(i);
                }
                audioContextRef.current.decodeAudioData(audioBuffer.buffer)
                  .then((decodedData) => {
                    console.log("Decoded audio buffer:", decodedData);
                    const source = audioContextRef.current!.createBufferSource();
                    source.buffer = decodedData;

                    // Add a gain node to control volume
                    const gainNode = audioContextRef.current!.createGain();
                    gainNode.gain.value = 1; // Set volume to 100%
                    source.connect(gainNode).connect(audioContextRef.current!.destination);

                    setIsServerPlaying(true);
                    setIsPlaying(true);
                    source.start();
                    console.log("Audio playback started");

                    source.onended = () => {
                      setIsPlaying(false);
                      setIsServerPlaying(false);
                      currentAudioSourceRef.current = null;
                      console.log("Audio playback ended");
                    };
                  })
                  .catch((error) => {
                    console.error("Audio decode error: " + error.message);
                  });
              } catch (e) {
                console.error("Base64 decoding failed: " + (e instanceof Error ? e.message : e));
              }
              break;

            case "done":
              // Only fallback to Web Speech API if no audio chunk and not a heartbeat
              try {
                const rawText = lastTextChunkRef.current || message.data || message.text || "";
                const normalized = rawText.trim().toLowerCase();
                if (normalized !== "pong!" && !hasAudioRef.current) {
                  setIsServerPlaying(true);
                  const utterance = new SpeechSynthesisUtterance(rawText);
                  utterance.onend = () => {
                    setIsServerPlaying(false);
                  };
                  window.speechSynthesis.speak(utterance);
                } else {
                  console.log("Skipping TTS fallback (heartbeat or audio provided)");
                }
              } catch (e) {
                console.error("TTS playback error:", e);
              } finally {
                // Reset audio flag for next response
                hasAudioRef.current = false;
              }
              break;

            default:
              console.log(`Received message of type: ${message.type}`);
          }
        } catch (e) {
          console.error(`Error processing message: ${e instanceof Error ? e.message : e}`);
        }
      };

      // This is where connection initialization happens
      newSocket.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log("Socket connection opened!");

        // Defer state updates to next tick to avoid React batching issues
        setTimeout(() => {
          if (!isMounted.current) {
            console.log("Component unmounted during socket open, closing socket");
            try {
              newSocket.close();
            } catch (e) {
              console.error("Error closing socket:", e);
            }
            isSocketInitializing.current = false;
            return;
          }

          connectionAttemptsRef.current = 0;
          console.log("Socket connection successful! Voice ID:", currentVoiceId);
          setSocket(newSocket);
          socketRef.current = newSocket;
          setIsConnected(true);
          isSocketInitializing.current = false;

          try {
            // Send only userId, voiceId, and profileDocument to the socket server
            const initialMsg = {
              type: "connection_init",
              user_id: userId,
              voice_id: currentVoiceId,
              profileDocument: profileInfo.profileDocument || "", // Ensure profileDocument is sent
            };
            console.log("Sending initial connection:", initialMsg);
            newSocket.send(JSON.stringify(initialMsg));
          } catch (err) {
            console.error("Error sending initial connection:", err);
          }

          // Heartbeat messages are also sent periodically
          if (!heartbeatIntervalRef.current) {
            heartbeatIntervalRef.current = setInterval(() => {
              if (newSocket.readyState === WebSocket.OPEN && isMounted.current) {
                try {
                  const heartbeatMsg = {
                    type: "heartbeat",
                    user_id: userId,
                    voice_id: currentVoiceId,
                    profileDocument: profileInfo.profileDocument || "",
                    value: "ping",
                    text: "ping",
                  };
                  console.log("Sending heartbeat:", heartbeatMsg);
                  newSocket.send(JSON.stringify(heartbeatMsg));
                } catch (err) {
                  console.error("Error sending heartbeat:", err);
                }
              } else if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
              }
            }, 30000);
          }
        }, 0);
      };
    } catch (error) {
      console.error("Error initializing socket:", error);
      isSocketInitializing.current = false;
      handleError("Failed to connect to voice server. Please refresh the page and try again.");
      setIsConnected(false);
      handleSocketError("Failed to connect to socket server.");
    }
  };

  const handleSendMessage = async (manualTranscript?: string) => {
    const messageToSend = manualTranscript || inputText;
    if (!messageToSend.trim() || isProcessing) return;

    try {
      setIsProcessing(true);
      const userMessage = messageToSend.trim();
      const requestId = generateRequestId();

      const messageCopy = userMessage;
      setInputText("");
      let currentVoiceId: string;
      let currentProfileInfo = userProfileInfo;
      try {
        currentVoiceId = await fetchVoiceId(user?.id || "");

        if (!currentProfileInfo.firstName && !currentProfileInfo.lastName) {
          currentProfileInfo = await fetchUserProfileInfo(user?.id || "");
        }
      } catch (voiceIdError) {
        console.error("Voice ID error:", voiceIdError);
        throw new Error("Could not start conversation: voice configuration issue.");
      }
      processedMessageIds.current.clear();
      processedMessageContents.current.clear();
      pendingRequests.current.clear();
      // Ensure messageCopy is a string before setting it
      if (typeof messageCopy === 'string') {
        pendingRequests.current.set(requestId, messageCopy);
      }

      setMessages((prev) => [
        ...prev,
        { text: messageCopy, sender: "user", timestamp: new Date() },
      ]);

      if (!userStartedConversation) {
        setUserStartedConversation(true);
        if (socket?.readyState === WebSocket.OPEN) {
          const messageObj = {
            type: "start_conversation",
            message: messageCopy,
            request_id: requestId,
            user_id: user?.id,
            voice_id: currentVoiceId,
            firstName: currentProfileInfo.firstName || "",
            lastName: currentProfileInfo.lastName || "",
            dob: currentProfileInfo.dob || "",
            profileDocument: currentProfileInfo.profileDocument || "", // Ensure this is a string
            text: messageCopy,
          };
          console.log("Sending start conversation with voice ID and profile info:", messageObj);
          socket.send(JSON.stringify(messageObj));
          return;
        }
      }

      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log(`Sending message with request ID: ${requestId} and voice ID: ${currentVoiceId}`);

        try {
          const messageObj = {
            type: "user_message",
            message: messageCopy,
            request_id: requestId,
            user_id: user?.id || "unknown",
            voice_id: currentVoiceId,
            firstName: currentProfileInfo.firstName || "",
            lastName: currentProfileInfo.lastName || "",
            dob: currentProfileInfo.dob || "",
            profileDocument: currentProfileInfo.profileDocument || "", // Ensure this is a string
            text: messageCopy,
          };

          socket.send(JSON.stringify(messageObj));

          const requests = Array.from(pendingRequests.current.entries());
          if (requests.length > 5) {
            const oldestRequestId = requests[0][0];
            pendingRequests.current.delete(oldestRequestId);
          }
        } catch (socketError) {
          console.error("Socket communication error:", socketError);
          throw new Error("Failed to send message through socket");
        }
      } else {
        throw new Error("Communication failed - socket not connected");
      }
    } catch (error) {
      console.error("Error handling message:", error);

      let errorMessage = "Sorry, I encountered an error while processing your message.";

      if (error instanceof Error) {
        if (error.message.includes("voice configuration")) {
          errorMessage = "Voice configuration error. Please refresh the page and try again.";
        } else if (error.message.includes("500")) {
          errorMessage = "The conversation service is currently unavailable. Please try again later.";
        } else if (error.message.includes("401") || error.message.includes("403")) {
          errorMessage = "You don't have permission to use this service. Please check your login status.";
        } else if (error.message.includes("429")) {
          errorMessage = "You've sent too many messages too quickly. Please wait a moment and try again.";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          text: errorMessage,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // PATCH: sendProfileInitialization function - use derived file name convention for profileDocument
  const sendProfileInitialization = (socketObj: WebSocket, userId: string, voiceId: string, profileInfo: UserProfileInfo) => {
    // Derive file name directly since it's the only file in the folder
    const fileName = `${userId}_memorial_profile.txt`;
    const relativeDocPath = `${userId}/profile_description/${fileName}`;
    const initMessage = {
      type: "connection_init",
      user_id: userId,
      voice_id: voiceId,
      firstName: profileInfo.firstName || "",
      lastName: profileInfo.lastName || "",
      dob: profileInfo.dob || "",
      profileDocument: profileInfo.profileDocument || relativeDocPath, // Use profileInfo.profileDocument if available
    };
    socketObj.send(JSON.stringify(initMessage));
  };

  const sendDisconnect = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      if (!voiceId) {
        console.warn("No voice ID available for disconnect message");
        socket.close();
        return;
      }

      socket.send(
        JSON.stringify({
          type: "disconnect",
          user_id: user?.id,
          voice_id: voiceId,
          firstName: userProfileInfo.firstName || "",
          lastName: userProfileInfo.lastName || "",
          dob: userProfileInfo.dob || "",
          profileDocument: userProfileInfo.profileDocument || "", // Ensure this is a string
          text: "disconnect",
          value: "cleanup",
          timestamp: Date.now(),
        })
      );
    }
  };

  // Add in component mount and cleanup effects
  useEffect(() => {
    console.log("Component mount effect running with user:", user?.id);
    
    // Set mounted flag to true FIRST
    isMounted.current = true;
    
    mountCountRef.current += 1;
    console.log(`Component mount count: ${mountCountRef.current}`);
    setIsComponentMounted(true);

    // Initialize audio
    initAudio();
    
    // Check microphone permission
    checkMicrophonePermission();
    
    // Set up push-to-talk shortcuts
    const cleanupShortcuts = setupPushToTalkShortcuts();
    
    // Initialize the user ID
    userIdRef.current = user?.id || `user_${Date.now()}`;
    
    // Initialize WebSocket connection with a longer delay
    let socketInitTimeout: NodeJS.Timeout | null = null;
    
    if (user?.id) {
      console.log("Setting up WebSocket connection with delay");
      const userId = user.id; // Store the id in a constant to ensure TypeScript knows it's defined
      socketInitTimeout = setTimeout(() => {
        if (isMounted.current) {
          console.log("Delayed socket initialization starting");
          try {
            initializeSocket(userId); // Use the stored userId which TypeScript knows is defined
          } catch (error) {
            console.error("Error during delayed socket initialization:", error);
          }
        } else {
          console.log("Component already unmounted, skipping delayed socket initialization");
        }
      }, 1000); // Longer delay to ensure component is fully mounted
    }

    // Mark page as loaded once setup is complete
    setIsLoaded(true);

    // Clean up on component unmount
    return () => {
      // Set mounted flag to false FIRST in cleanup
      isMounted.current = false;
      console.log("Component unmounting - cleaning up resources");
      
      // Clear the socket initialization timeout if it exists
      if (socketInitTimeout) {
        console.log("Clearing socket initialization timeout");
        clearTimeout(socketInitTimeout);
      }
      
      // Clean up existing socket if present
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.log("Closing existing WebSocket connection");
        sendDisconnect();
      }
      
      // Clean up speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors
        }
        recognitionRef.current = null;
      }
      
      // Clean up audio
      if (currentAudioSourceRef.current) {
        try {
          currentAudioSourceRef.current.stop();
        } catch (e) {
          // Ignore errors
        }
        currentAudioSourceRef.current = null;
      }
      
      // Close audio context
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Ignore errors
        }
        audioContextRef.current = null;
      }
      
      // Stop microphone stream
      if (micStreamRef.current) {
        try {
          micStreamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) {
          // Ignore errors
        }
        micStreamRef.current = null;
      }
      
      // Clear heart beat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      // Clean up keyboard shortcuts
      cleanupShortcuts();
    };
  }, [user]);

  // Visual indicator for push-to-talk
  const PushToTalkIndicator = () => {
    if (isListening) {
      return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white py-2 px-4 rounded-full animate-pulse flex items-center">
          <span className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></span>
          Listening... (Release spacebar when done)
        </div>
      );
    }
    return null;
  };

  if (!user || !user.id) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="p-6 bg-slate-800 rounded-lg shadow-lg">
          <h2 className="text-xl text-white mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please log in to access the conversation feature.</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Indicator for when AI is speaking
  const AITalkingIndicator = () => {
    if (!isServerPlaying) return null;
    return (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
        <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></span>
        <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-150"></span>
        <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-300"></span>
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        {/* Pulsing circle for speech activity */}
        <PulsingCircle
          isSpeaking={isListening || isServerPlaying}
          size={128}
          colorClass="bg-blue-500"
        />

        <div className="text-center">
          <h2 className="text-xl text-white font-semibold">
            {isListening
              ? "Listening..."
              : isServerPlaying
              ? "Speaking..."
              : "Ready to start the conversation"}
          </h2>
          <p className="text-gray-400">
            {isListening
              ? "Speak now, we are capturing your input."
              : isServerPlaying
              ? "The AI is responding to your query."
              : "Press and hold the spacebar to speak."}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-700 p-4">
        <div className="flex justify-center items-center space-x-4 py-4">
          <PushToTalkIndicator />
          <AITalkingIndicator />
        </div>
      </div>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} style={{ display: "none" }} />
    </div>
  );
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}