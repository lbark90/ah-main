"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../lib/context/UserContext";
import { useAssistant } from "../../lib/context/AssistantContext";

// CSS-based pulsing circle component
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
      <div
        className={`absolute rounded-full ${colorClass} ${isSpeaking ? 'animate-pulse-ring' : ''}`}
        style={{ width: size, height: size, opacity: 0.6 }}
      />
      <div
        className={`absolute rounded-full ${colorClass} ${isSpeaking ? 'animate-pulse' : ''}`}
        style={{ width: size * 0.8, height: size * 0.8, opacity: 0.8 }}
      />
      <div
        className={`rounded-full ${colorClass}`}
        style={{ width: size * 0.65, height: size * 0.65 }}
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
  memorializedName = "Sarah Johnson", // <-- This is the hardcoded default name
  onConversationEnd,
  userDob = "", // Add DOB parameter with default value
}: ConversationUIProps) {
  const router = useRouter();
  const { user } = useUser();
  const { assistant, conversation, isLoading: isAssistantLoading } = useAssistant();

  // Get userId properly - check both username and id since the field may vary
  const getUserId = () => {
    const userId = user?.id || user?.username || "";
    if (!userId) {
      console.log("No user ID found in user object:", user);
    }
    return userId;
  };

  useEffect(() => {
    console.log("Current user in ConversationUI:", user);

    // Only redirect if we've confirmed no user exists after initial load
    if (typeof window !== 'undefined' && !isAssistantLoading && !user) {
      console.log("No user detected after initial load, redirecting to login");
      router.push("/login");
    }
  }, [user, router, isAssistantLoading]);

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
  const userIdRef = useRef<string>(user?.username || `user_${Date.now()}`);
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isSocketInitializing = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Add a static ref to track if a socket has already been created
  const socketCreatedRef = useRef<boolean>(false);

  // Add a socketConnecting state to prevent duplicate connections
  const socketConnecting = useRef(false);

  // Initialize audio context
  const initAudio = () => {
    try {
      const AudioContextClass = typeof window !== "undefined"
        ? (window.AudioContext || (window as any).webkitAudioContext)
        : null;
      if (!AudioContextClass) {
        console.error("Web Audio API not supported in this browser");
        return false;
      }
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
        console.log("Audio context initialized successfully");
        if (audioContextRef.current.state === "suspended") {
          console.log("Audio context is suspended - this is normal, will resume on user interaction");
        }
        return true;
      } else {
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current
            .resume()
            .then(() => {
              console.log("Existing audio context resumed");
            })
            .catch((err) => {
              console.error(err);
            });
        }
        return true;
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Check microphone permission
  const checkMicrophonePermission = async () => {
    if (micPermissionChecked && micStreamRef.current) {
      console.log("Microphone already initialized");
      return micStreamRef.current;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      console.error("Microphone not supported or detected in this browser");
      setMicPermissionChecked(true);
      setError("No microphone detected. Please connect a microphone or use a supported browser.");
      return null;
    }

    console.log("Requesting microphone permission...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone access granted");
      setMicPermissionChecked(true);
      micStreamRef.current = stream;

      // Test the microphone by analyzing audio level briefly
      try {
        const AudioContextClass = typeof window !== "undefined"
          ? (window.AudioContext || (window as any).webkitAudioContext)
          : null;
        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
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
        } else {
          console.error("Web Audio API not supported for microphone test");
        }
      } catch (e) {
        console.error(e);
      }

      return stream;
    } catch (err) {
      console.error(err);
      setMicPermissionChecked(true);
      setError("Unable to access microphone. Please check your device and permissions.");
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
        try {
          // TypeScript doesn't recognize SpeechRecognition API by default
          const SpeechRecognition =
            typeof window !== "undefined"
              ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
              : null;
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

          recognition.onerror = function (event: any) {
            console.error(event);
            setIsListening(false);
          };

          recognition.onresult = function (event: any) {
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
          console.error(e);
          setIsListening(false);
          recognitionRef.current = null;
        }
      })
      .catch((err) => {
        console.error(err);
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
      // Try to reconnect if not connected
      const userId = getUserId();
      if (userId && !isSocketInitializing.current) {
        console.log("Attempting to reconnect socket before sending message");
        initializeSocket(userId, voiceId || "", userProfileInfo.firstName || "", userProfileInfo.lastName || "", userProfileInfo.dob || "", userProfileInfo.profileDocument || "");
      }
      return false;
    }

    try {
      console.log(`Sending message to server: "${message.trim()}"`);
      if (socketObj && socketObj.readyState === WebSocket.OPEN) {
        socketObj.send(
          JSON.stringify({
            type: "user_message",
            user_id: userIdRef.current,
            message: message.trim(),
            timestamp: Date.now(),
          })
        );
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error sending transcript:", e);
      return false;
    }
  };

  const handleSendMessage = async (manualTranscript?: string) => {
    const messageToSend = manualTranscript || inputText;
    if (!messageToSend.trim() || isProcessing) return;

    try {
      setIsProcessing(true);
      const userMessage = messageToSend.trim();
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const messageCopy = userMessage;
      setInputText("");
      let currentVoiceId: string;
      let currentProfileInfo = userProfileInfo;
      try {
        const userId = getUserId();
        currentVoiceId = await fetchVoiceId(userId);

        if (!currentProfileInfo.firstName && !currentProfileInfo.lastName) {
          currentProfileInfo = await fetchUserProfileInfo(userId);
        }
      } catch (voiceIdError) {
        console.error("Voice ID error:", voiceIdError);
        throw new Error("Could not start conversation: voice configuration issue.");
      }

      processedMessageIds.current.clear();
      processedMessageContents.current.clear();
      pendingRequests.current.clear();
      if (typeof messageCopy === 'string') {
        pendingRequests.current.set(requestId, messageCopy);
      }

      if (!userStartedConversation) {
        setUserStartedConversation(true);
        if (socket && socket.readyState === WebSocket.OPEN) {
          const messageObj = {
            type: "start_conversation",
            message: messageCopy,
            request_id: requestId,
            user_id: getUserId(),
            voice_id: currentVoiceId,
            firstName: currentProfileInfo.firstName || "",
            lastName: currentProfileInfo.lastName || "",
            dob: currentProfileInfo.dob || "",
            profileDocument: currentProfileInfo.profileDocument || "",
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
            user_id: getUserId(),
            voice_id: currentVoiceId,
            firstName: currentProfileInfo.firstName || "",
            lastName: currentProfileInfo.lastName || "",
            dob: currentProfileInfo.dob || "",
            profileDocument: currentProfileInfo.profileDocument || "",
            text: messageCopy,
          };

          socket.send(JSON.stringify(messageObj));

          const requests = Array.from(pendingRequests.current.entries()) as [string, string][];
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

      // Add debug logging
      fetch('/api/socket-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getUserId(),
          action: 'send_message',
          timestamp: new Date().toISOString(),
          message_length: messageCopy.length,
          socket_state: socket ? socket.readyState : 'null',
          connected: isConnected
        })
      }).catch(err => console.error("Socket debug API error:", err));
    } catch (error) {
      console.error(error);

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
    } finally {
      setIsProcessing(false);
    }
  };

  // Add in component mount and cleanup effects
  useEffect(() => {
    // Set mounted flag to true immediately
    isMounted.current = true;
    console.log("Component mount effect running with user:", user?.id);

    // Track mount count for debugging
    const mountCount = mountCountRef.current + 1;
    mountCountRef.current = mountCount;
    console.log("Component mount count:", mountCount);

    // Make sure we start with socket created flag as false
    socketCreatedRef.current = false;

    // Add a data-mounted attribute to the DOM for socket connection reference
    const mountedElement = document.createElement('div');
    mountedElement.setAttribute('id', 'conversation-ui-mounted');
    mountedElement.setAttribute('data-conversation-mounted', 'true');
    mountedElement.setAttribute('data-user-id', user?.id || '');
    document.body.appendChild(mountedElement);

    setIsComponentMounted(true);

    // Initialize audio
    initAudio();

    // Check microphone permission
    checkMicrophonePermission();

    // Set up push-to-talk shortcuts
    const cleanupShortcuts = setupPushToTalkShortcuts();

    // Initialize the user ID
    userIdRef.current = getUserId() || `user_${Date.now()}`;

    // Mark page as loaded once setup is complete
    setIsLoaded(true);

    // Clean up on component unmount
    return () => {
      // Set mounted flag to false FIRST in cleanup
      isMounted.current = false;
      console.log("Component unmounting - cleaning up resources");

      // Remove the mounted element marker
      const mountEl = document.getElementById('conversation-ui-mounted');
      if (mountEl) {
        mountEl.remove();
      }

      // Reset the socket created flag
      socketCreatedRef.current = false;

      // Use a local reference to the socket to avoid closure issues
      const currentSocket = socketRef.current;

      // Clean up existing socket if present
      if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
        console.log("Closing existing WebSocket connection");
        try {
          // First try to send a disconnect message
          if (voiceId) {
            try {
              const disconnectMessage = JSON.stringify({
                type: "disconnect",
                user_id: getUserId(),
                voice_id: voiceId,
                firstName: userProfileInfo.firstName || "",
                lastName: userProfileInfo.lastName || "",
                dob: userProfileInfo.dob || "",
                profileDocument: userProfileInfo.profileDocument || "",
                text: "disconnect",
                value: "cleanup",
                timestamp: Date.now(),
              });

              console.log("Sending final disconnect on unmount:", disconnectMessage);
              currentSocket.send(disconnectMessage);

              // Use a synchronous approach for unmounting to ensure the message gets sent
              console.log("Waiting briefly for disconnect message to send");
            } catch (disconnectErr) {
              console.error("Error sending final disconnect message:", disconnectErr);
            }
          }

          // Close the socket with a small delay to allow the message to be sent
          setTimeout(() => {
            try {
              if (currentSocket.readyState === WebSocket.OPEN) {
                currentSocket.close(1000, "Component unmounting");
                console.log("Socket closed on unmount");
              }
            } catch (closeErr) {
              console.error("Error closing socket on unmount:", closeErr);
            }
          }, 100);
        } catch (err) {
          console.error("Error during socket cleanup:", err);
          // Force close as a last resort
          try {
            currentSocket.close();
          } catch (forceCloseErr) {
            console.error("Error force-closing socket:", forceCloseErr);
          }
        }
      } else if (currentSocket) {
        console.log("Socket not in OPEN state during cleanup, current state:",
          currentSocket.readyState === WebSocket.CONNECTING ? "CONNECTING" :
            currentSocket.readyState === WebSocket.CLOSED ? "CLOSED" :
              currentSocket.readyState === WebSocket.CLOSING ? "CLOSING" : "UNKNOWN");
      }

      // Additional cleanup for socket reference - reset all socket-related state
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);

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

  // Modify the initializeSocket function to prevent duplicate connections
  async function initializeSocket(
    userId: string,
    voiceId: string,
    firstName: string,
    lastName: string,
    dob: string,
    profileDocument: string
  ) {
    // Check if socket already exists and is connected or connecting
    if (socketRef.current && (
      socketRef.current.readyState === WebSocket.OPEN ||
      socketRef.current.readyState === WebSocket.CONNECTING)) {
      console.log("Socket already exists and is in OPEN or CONNECTING state, reusing existing connection");
      return socketRef.current;
    }

    // Check if we're already in the process of connecting
    if (socketConnecting.current) {
      console.log("Socket connection already in progress, skipping duplicate initialization");
      return null;
    }

    // Set connecting flag to true
    socketConnecting.current = true;
    isSocketInitializing.current = true;

    try {
      // Log where the initialization is happening from
      console.log(`Initializing WebSocket from ${new Error().stack?.split('\n')[2] || 'unknown location'}`);

      // Construct the profileDocument path if missing
      if (!profileDocument) {
        profileDocument = `${userId}/profile_description/${userId}_memorial_profile.txt`;
        console.log("Constructed profileDocument path:", profileDocument);
      }

      // Fetch missing parameters from the API route if necessary
      if (!voiceId || !firstName || !lastName || !dob) {
        console.log("Fetching missing parameters from API...");

        // Use Promise.all to fetch voice ID and user credentials in parallel
        const [voiceIdResponse, credentialsResponse] = await Promise.all([
          voiceId ? Promise.resolve(voiceId) : fetchVoiceId(userId),
          fetch(`/api/user/fetch-credentials?userId=${userId}`).then(res => {
            if (!res.ok) {
              throw new Error(`Failed to fetch credentials: ${res.statusText}`);
            }
            return res.json();
          })
        ]);

        voiceId = voiceId || voiceIdResponse;
        firstName = firstName || credentialsResponse.firstName || "";
        lastName = lastName || credentialsResponse.lastName || "";
        dob = dob || credentialsResponse.dob || "";

        // If DOB is still empty after fetching from GCP, use a placeholder value
        // This ensures we don't fail validation but also don't hardcode a specific date
        if (!dob) {
          console.log("DOB is still empty after fetching, using placeholder");
          dob = "unknown";
        }

        console.log("Updated parameters after fetching:", {
          userId,
          voiceId,
          firstName,
          lastName,
          dob,
          profileDocument,
        });
      }

      // Validate required parameters
      if (!userId || !voiceId || !firstName || !lastName || !dob || !profileDocument) {
        console.warn("Cannot initialize WebSocket: Missing required parameters", {
          userId,
          voiceId,
          firstName,
          lastName,
          dob,
          profileDocument,
        });
        socketConnecting.current = false;
        isSocketInitializing.current = false;
        return null;
      }

      console.log(`Initializing WebSocket for user ID: ${userId}`);

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const socketUrl = `${protocol}//${host}:8080`;
      console.log(`Attempting WebSocket connection to: ${socketUrl}`);

      const socket = new WebSocket(socketUrl);

      // Store the socket immediately to prevent race conditions
      socketRef.current = socket;

      socket.onopen = function () {
        console.log("WebSocket connection established successfully");
        socketConnecting.current = false;

        const connectionInitMessage = {
          type: "connection_init",
          user_id: userId,
          voice_id: voiceId,
          firstName: firstName,
          lastName: lastName,
          dob: dob,
          profileDocument: profileDocument,
          text: "connection_init",
          value: "init",
        };
        console.log("Sending connection_init message:", JSON.stringify(connectionInitMessage));
        socket.send(JSON.stringify(connectionInitMessage));
      };

      socket.onerror = function (event) {
        console.error("WebSocket error occurred:", event);
        socketConnecting.current = false;
        isSocketInitializing.current = false;
      };

      socket.onclose = function (event) {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        socketConnecting.current = false;
        isSocketInitializing.current = false;
      };

      socket.onmessage = function (event) {
        console.log("Received message from server:", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("Parsed message:", data);
        } catch (e) {
          console.error("Error parsing message:", e);
        }
      };

      return socket;
    } catch (error) {
      console.error("Error in initializeSocket:", error);
      socketConnecting.current = false;
      isSocketInitializing.current = false;
      return null;
    }
  }

  // Modify the useEffect for socket initialization
  useEffect(() => {
    console.log("Running socket initialization effect");

    // Wrap logic in an async function since we may need to fetch missing data
    const tryInitializeSocket = async () => {
      // Get the user ID for the socket connection
      if (!userIdRef.current) {
        const userId = getUserId();
        if (userId) {
          userIdRef.current = userId;
        }
      }

      // Check if we already have a socket connection before creating a new one
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        console.log("Socket already exists in useEffect, not reinitializing");
        return;
      }

      // Only proceed if we're not already connecting
      if (socketConnecting.current) {
        console.log("Socket connection already in progress in useEffect, skipping");
        return;
      }

      // If any required data is missing, fetch it and update state, then return to let the effect rerun
      if (
        !voiceId ||
        !userProfileInfo.firstName ||
        !userProfileInfo.lastName ||
        !userProfileInfo.dob ||
        !userProfileInfo.profileDocument
      ) {
        console.log("Fetching missing user profile and voiceId...");
        const updatedVoiceId = await fetchVoiceId(userIdRef.current);
        const updatedProfile = await fetchUserProfileInfo(userIdRef.current);
        setVoiceId(updatedVoiceId);
        setUserProfileInfo(updatedProfile);
        return; // wait for next effect run with updated data
      }

      // Only initialize socket if we have the required data
      if (
        userIdRef.current &&
        voiceId &&
        userProfileInfo.firstName &&
        userProfileInfo.lastName &&
        userProfileInfo.dob &&
        userProfileInfo.profileDocument
      ) {
        console.log("All prerequisites met, initializing socket connection");

        initializeSocket(
          userIdRef.current,
          voiceId,
          userProfileInfo.firstName,
          userProfileInfo.lastName,
          userProfileInfo.dob,
          userProfileInfo.profileDocument
        ).then(socket => {
          if (socket) {
            // Start heartbeat if needed
            if (!heartbeatIntervalRef.current) {
              startHeartbeat();
            }
          }
        });
      } else {
        console.log("Missing required data for socket initialization:", {
          userId: userIdRef.current,
          voiceId,
          firstName: userProfileInfo.firstName,
          lastName: userProfileInfo.lastName,
          dob: userProfileInfo.dob,
          profileDocument: userProfileInfo.profileDocument
        });
      }
    };

    tryInitializeSocket();

    // Clean up function
    return () => {
      if (socketRef.current) {
        console.log("Cleaning up WebSocket connection");

        // Only attempt to close if the socket is open
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close(1000, "Component unmounting");
        }

        // Reset refs
        socketRef.current = null;
        socketConnecting.current = false;
        isSocketInitializing.current = false;
      }

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };

    // Only run this effect once during mount, don't track dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add another effect to handle dependency changes and update socket if needed
  useEffect(() => {
    // We only care about updating the socket if dependencies change AND
    // there's no existing socket connection
    if (!socketRef.current &&
      !socketConnecting.current &&
      userIdRef.current &&
      voiceId &&
      userProfileInfo.firstName &&
      userProfileInfo.lastName &&
      userProfileInfo.dob &&
      userProfileInfo.profileDocument) {

      console.log("Dependencies changed, creating new socket connection");

      initializeSocket(
        userIdRef.current,
        voiceId,
        userProfileInfo.firstName,
        userProfileInfo.lastName,
        userProfileInfo.dob,
        userProfileInfo.profileDocument
      ).then(socket => {
        if (socket) {
          // Start heartbeat if needed
          if (!heartbeatIntervalRef.current) {
            startHeartbeat();
          }
        }
      });
    }
  }, [voiceId, userProfileInfo]);

  // Add event listeners for the custom events
  useEffect(() => {
    const handlePushToTalkStart = () => {
      if (typeof window !== 'undefined' && isMounted.current) {
        startPushToTalk();
      }
    };

    const handlePushToTalkStop = () => {
      if (typeof window !== 'undefined' && isMounted.current) {
        stopPushToTalk();
      }
    };

    const handleSocketError = (event: CustomEvent) => {
      if (isMounted.current) {
        setSocketError(event.detail.error);
      }
    };

    const handleAssistantAudio = ((event: CustomEvent) => {
      if (!isMounted.current) return;

      try {
        console.log("Received audio event with data length:", event.detail.audio?.length || 0);

        if (!event.detail.audio) {
          console.warn("No audio data in event");
          return;
        }

        // Decode base64 audio and play it
        const audioData = event.detail.audio;
        const audioBlob = base64ToBlob(audioData, 'audio/mpeg');

        if (!audioBlob || audioBlob.size === 0) {
          console.error("Failed to create audio blob or blob is empty");
          return;
        }

        // Create audio URL and set up playback
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log("Created audio URL:", audioUrl);

        // Get audio element
        const audioElement = audioRef.current;
        if (!audioElement) {
          console.error("Audio element ref is null");
          return;
        }

        // Clean up previous audio
        if (currentAudio) {
          URL.revokeObjectURL(currentAudio.src);
        }

        // Set up new audio
        audioElement.src = audioUrl;
        setCurrentAudio(audioElement);
        setIsServerPlaying(true);

        // Add event listeners
        audioElement.onended = () => {
          console.log("Audio playback ended");
          setIsServerPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };

        audioElement.onerror = (e) => {
          console.error("Audio playback error:", e);
          setIsServerPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };

        // Play the audio
        audioElement.play().catch(err => {
          console.error("Failed to play audio:", err);
          setIsServerPlaying(false);
        });
      } catch (error) {
        console.error("Error handling audio event:", error);
        setIsServerPlaying(false);
      }
    }) as EventListener;

    document.addEventListener('push-to-talk-start', handlePushToTalkStart as EventListener);
    document.addEventListener('push-to-talk-stop', handlePushToTalkStop as EventListener);
    document.addEventListener('socket-error', handleSocketError as EventListener);
    document.addEventListener('assistant-audio', handleAssistantAudio);

    return () => {
      document.removeEventListener('push-to-talk-start', handlePushToTalkStart as EventListener);
      document.removeEventListener('push-to-talk-stop', handlePushToTalkStop as EventListener);
      document.removeEventListener('socket-error', handleSocketError as EventListener);
      document.removeEventListener('assistant-audio', handleAssistantAudio);
    };
  }, []);

  // Add helper function to convert base64 to blob
  const base64ToBlob = (base64: string, mimeType: string): Blob | null => {
    try {
      // Remove any data URL prefix
      const base64Data = base64.replace(/^data:audio\/\w+;base64,/, "");

      // Decode base64
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return new Blob([bytes], { type: mimeType });
    } catch (error) {
      console.error("Error converting base64 to blob:", error);
      return null;
    }
  };

  // Scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Visual indicator for push-to-talk
  const PushToTalkIndicator = () => {
    if (isListening) {
      return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white py-3 px-6 rounded-full shadow-lg animate-pulse flex items-center space-x-3 z-20">
          <div className="relative flex space-x-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <span>Listening...</span>
        </div>
      );
    }
    return null;
  };

  // Indicator for when AI is speaking
  const AITalkingIndicator = () => {
    if (!isServerPlaying) return null;
    return (
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white py-3 px-6 rounded-full shadow-lg z-20 flex items-center space-x-3">
        <div className="relative flex space-x-1">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></span>
        </div>
        <span>{memorializedName} is speaking...</span>
      </div>
    );
  };

  if (!user) {
    console.log("Showing auth required UI while checking user state");
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a102a]">
        <div className="p-8 bg-slate-800 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100/10">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h2 className="text-xl text-white mb-4 font-semibold text-center">Authentication Required</h2>
          <p className="text-slate-300 mb-6 text-center">Please log in to access the conversation feature.</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-medium rounded-lg flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
            </svg>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a102a]">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-300">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full justify-center items-center bg-[#0a102a]">
        <div className="p-8 bg-slate-800 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100/10">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-xl text-white mb-4 font-semibold text-center">Error</h2>
          <p className="text-slate-300 mb-6 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-medium rounded-lg flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#0f172a]">
      {/* Main conversation area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Central pulsing circle - match the design in screenshot */}
        <div className="flex-none pt-16 pb-6 flex items-center justify-center">
          <div className="relative">
            <PulsingCircle isSpeaking={isServerPlaying} size={112} />
          </div>
        </div>

        {/* Status text */}
        <div className="flex-none text-center pb-10">
          <h2 className="text-2xl text-white font-normal">
            {isListening
              ? "Listening..."
              : isServerPlaying
                ? `${memorializedName} is speaking...`
                : "Ready to start the conversation"}
          </h2>
          <p className="text-slate-400 mt-2">
            {isListening
              ? "Speak now, we are capturing your input."
              : isServerPlaying
                ? "The AI is responding to your message."
                : "Press and hold the spacebar to speak."}
          </p>
        </div>
      </div>

      {/* Push to talk area - simplified to match screenshot */}
      <div className="flex justify-center items-center pb-16">
        <button
          className="bg-slate-800 hover:bg-slate-700 text-white rounded-full p-6 flex items-center justify-center shadow-lg focus:outline-none transition-all"
          onMouseDown={startPushToTalk}
          onMouseUp={stopPushToTalk}
          onTouchStart={startPushToTalk}
          onTouchEnd={stopPushToTalk}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
          </svg>
        </button>
      </div>

      {/* Help text */}
      <div className="text-center pb-8">
        <p className="text-slate-500 text-sm">
          Press and hold to speak or press <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs">Space</kbd>
        </p>
      </div>

      {/* Indicators */}
      <PushToTalkIndicator />
      <AITalkingIndicator />

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} style={{ display: "none" }} />
    </div>
  );
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Function to fetch the voice ID for a user
async function fetchVoiceId(userId: string): Promise<string> {
  try {
    const response = await fetch(`/api/voice/get-voice-id?userId=${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch voice ID: ${response.status}`);
    }
    const data = await response.json();
    return data.voiceId || "";
  } catch (error) {
    console.error("Error fetching voice ID:", error);
    return "";
  }
}

// Function to fetch user profile information
async function fetchUserProfileInfo(userId: string): Promise<UserProfileInfo> {
  try {
    console.log(`Fetching user profile for ${userId}`);
    const response = await fetch(`/api/user/profile?userId=${encodeURIComponent(userId)}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    const profileData = await response.json();
    console.log('Successfully fetched user profile:', profileData);

    return {
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || '',
      dob: profileData.dob || '',
      profileDocument: profileData.profileDocument || ''
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return default values instead of throwing an error to prevent the conversation from breaking
    return {
      firstName: '',
      lastName: '',
      dob: '',
      profileDocument: ''
    };
  }
}

// Helper function to send heartbeat
function sendHeartbeat(socket: WebSocket, userId: string) {
  try {
    if (socket.readyState === WebSocket.OPEN) {
      console.log("Sending heartbeat message");
      socket.send(JSON.stringify({
        type: "heartbeat",
        message: "keepalive",
        user_id: userId
      }));
    }
  } catch (error) {
    console.error("Error sending heartbeat:", error);
  }
}

function setupPushToTalkShortcuts() {
  let isSpacebarDown = false;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.keyCode === 32 && !isSpacebarDown) {
      event.preventDefault();
      isSpacebarDown = true;
      document.dispatchEvent(new CustomEvent('push-to-talk-start'));
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.keyCode === 32 && isSpacebarDown) {
      event.preventDefault();
      isSpacebarDown = false;
      document.dispatchEvent(new CustomEvent('push-to-talk-stop'));
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }

  return () => { };
}

function startPushToTalk() {
  document.dispatchEvent(new CustomEvent('push-to-talk-start'));
}

function stopPushToTalkFunction() {
  document.dispatchEvent(new CustomEvent('push-to-talk-stop'));
}

function setTranscriptSent(value: boolean) {
  document.dispatchEvent(new CustomEvent('transcript-sent-changed', {
    detail: { value }
  }));
}

function startHeartbeat() {
  throw new Error("Function not implemented.");
}

