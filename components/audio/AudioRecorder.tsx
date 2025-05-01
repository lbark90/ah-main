import { useState, useRef, useEffect } from "react";
import { useUser } from "../../lib/context/UserContext";
import { useInterview } from "../../lib/context/InterviewContext";

interface Props {
  questionIndex: number;
}

export default function InterviewRecorder({ questionIndex }: Props) {
  const { user } = useUser();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string>("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const [interviewData, setInterviewData] = useState({}); //Added to store interview data

  useEffect(() => {
    let isMounted = true;

    const loadQuestionAudio = async () => {
      try {
        // Clean up previous state
        setAudioBlob(null);
        setTranscript("");
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }

        // Clear existing player
        const container = document.querySelector(".audio-player-container");
        if (container) {
          container.innerHTML = "";
        }

        // Fetch recording for current question  //NOTE: This section is incomplete.  The server-side needs to be updated to handle audio requests correctly.
        if (user) {
          const userName = `${user.firstName}_${user.lastName}`;
          const audioUrl = `/api/audio/${userName}/${questionIndex + 1}`;
          audioUrlRef.current = audioUrl;
          console.log("User name:", userName);
          console.log("Question index:", questionIndex + 1);
          console.log("Attempting to load audio from:", audioUrl);
          if (container) {
            const audioElement = document.createElement("audio");
            audioElement.src = audioUrl;
            audioElement.controls = true;
            audioElement.style.width = "100%";
            audioElement.style.marginTop = "1rem";
            container.appendChild(audioElement);
          }
        }
      } catch (error) {
        console.error("Error loading question audio:", error);
      }
    };

    loadQuestionAudio();
    return () => {
      isMounted = false;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [questionIndex, user]);

  const [isBrowserSupported, setIsBrowserSupported] = useState(true);

  useEffect(() => {
    // Check for browser support only on client side
    if (typeof window !== "undefined") {
      setIsBrowserSupported(
        !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      );
    }
  }, []);

  const startRecording = async () => {
    try {
      // Check if running in secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        throw new Error(
          "Audio recording requires a secure context (HTTPS or localhost)",
        );
      }

      // Check for browser media API support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Audio recording is not supported - please enable microphone access",
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unable to access microphone";
      setError(
        `${errorMessage}. Please ensure you have granted microphone permissions in your browser settings.`,
      );
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !user) return;
    
    // Create a local isMounted flag
    let isMounted = true;

    const loadQuestionAudio = async () => {
      try {
        // Clean up previous state
        setAudioBlob(null);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }

        // Clear existing player
        const container = document.querySelector(".audio-player-container");
        if (container) {
          container.innerHTML = "";
        }

        // Fetch recording for current question
        if (user) {
          const userName = `${user.firstName}_${user.lastName}`;
          const audioUrl = `/api/audio/${userName}/${questionIndex + 1}`;
          audioUrlRef.current = audioUrl;
          console.log("User name:", userName);
          console.log("Question index:", questionIndex + 1);
          console.log("Attempting to load audio from:", audioUrl);
          if (container && isMounted) {
            const audioElement = document.createElement("audio");
            audioElement.src = audioUrl;
            audioElement.controls = true;
            audioElement.style.width = "100%";
            audioElement.style.marginTop = "1rem";
            container.appendChild(audioElement);
          }
        }
      } catch (error) {
        console.error("Error loading question audio:", error);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/mp3",
        });
        setAudioBlob(audioBlob);
        setIsRecording(false);

        if (!user) {
          setError("No user found - please log in");
          return;
        }

        if (!audioBlob) {
          setError("No recording found to upload");
          return;
        }

        // Create filename for the recording
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `question${questionIndex + 1}_${timestamp}.mp3`;
        const file = new File([audioBlob], fileName, { type: "audio/mp3" });

        // Upload to GCP bucket with folder structure
        try {
          // Create folder structure: memorial-voices/[name]/
          const userFolder = `${user.firstName}_${user.lastName}`;
          const folderPath = `memorial-voices/${userFolder}`;

          const formData = new FormData();
          formData.append("file", file);
          formData.append("userId", user?.id || "anonymous");
          formData.append("userName", `${user?.firstName || 'anonymous'}_${user?.lastName || 'user'}`);
          formData.append("fileType", "audio/mp3"); //Corrected file type
          formData.append("fileName", fileName);
          formData.append("type", "recordings");
          formData.append("questionNumber", (questionIndex + 1).toString()); //Added questionNumber
          formData.append("folderPath", `memorial-voices/${user?.firstName}_${user?.lastName}`);

          const response = await fetch("/api/storage/upload", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(
              `Upload failed: ${data.error || response.statusText}`,
            );
          }

          if (data.success) {
            // Create blob URL and update audio player
            const url = URL.createObjectURL(audioBlob);
            audioUrlRef.current = url;

            // Create a new audio element and set its properties
            const audioElement = document.createElement("audio");
            audioElement.src = url;
            audioElement.controls = true;
            audioElement.className = "w-full mt-4";

            // Update the container with the new audio element
            const container = document.querySelector(".audio-player-container");
            if (container) {
              container.innerHTML = ""; // Clear existing content
              container.appendChild(audioElement);
            }
          }
        } catch (uploadError) {
          console.error("Error uploading recording:", uploadError);
          const uploadErrorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : "Unknown upload error";
          setError(`Error uploading recording: ${uploadErrorMessage}`);
        }
      } catch (error) {
        console.error("Error saving recording:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setError(`Error saving recording: ${errorMessage}`);
      }
    };

    mediaRecorderRef.current.stop();
    if (mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const uploadRecording = async (file: File, fileName: string) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const updatedFileName = `question${questionIndex + 1}_${timestamp}.mp3`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user?.id || "anonymous");
      formData.append("userName", `${user?.firstName || 'anonymous'}_${user?.lastName || 'user'}`);
      formData.append("fileType", "audio/mp3"); //Corrected file type
      formData.append("fileName", updatedFileName);
      formData.append("type", "recordings");
      formData.append("questionNumber", (questionIndex + 1).toString()); //Added questionNumber
      formData.append("folderPath", `recordings/question${questionIndex + 1}`);

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to upload recording");
      }

      return data.fileName;
    } catch (error) {
      console.error("Error uploading recording:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      {!isBrowserSupported && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-lg mb-4">
          Your browser does not support audio recording. Please try using a
          modern browser like Chrome or Firefox.
        </div>
      )}
      <div className="flex justify-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Stop Recording
          </button>
        )}
      </div>
      <div className="audio-player-container"></div>
      {error && <div className="text-red-500">{error}</div>}{" "}
      {/* Display error messages */}
      {transcript && (
        <div className="mt-4">
          <h3 className="font-semibold">Transcript:</h3>
          <p className="text-gray-600">{transcript}</p>
        </div>
      )}
    </div>
  );
}