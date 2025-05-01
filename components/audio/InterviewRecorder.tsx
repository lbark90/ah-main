import { useState, useRef, useEffect } from "react";
import { useUser } from "../../lib/context/UserContext";
import { useInterview } from "../../lib/context/InterviewContext";

interface Props {
  questionIndex: number;
}

export default function InterviewRecorder({ questionIndex }: Props) {
  const { user } = useUser();
  const { addRecording, getCurrentQuestionRecording } = useInterview();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string>("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const [interviewData, setInterviewData] = useState({}); //Added to store interview data

  // Get the current recording if it exists
  const currentRecording = getCurrentQuestionRecording
    ? getCurrentQuestionRecording()
    : null;
  const hasExistingRecording =
    !!currentRecording && !!currentRecording.audioUrl;

  // Effect to handle recording availability message
  useEffect(() => {
    // This effect runs when audioBlob changes
    const container = document.querySelector(".audio-player-container");
    if (container && (audioBlob || hasExistingRecording)) {
      // If we have an audio blob or existing recording, we shouldn't show "No recording available"
      if (container.textContent?.includes("No recording available")) {
        container.innerHTML = ""; // Clear the message
      }
    }
  }, [audioBlob, hasExistingRecording]);

  useEffect(() => {
    let isMounted = true;

    const loadQuestionAudio = async () => {
      try {
        // Reset state when question changes
        setAudioBlob(null);
        setTranscript("");

        // Clean up previous audio element and URL
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }

        // Clear existing player
        const container = document.querySelector(".audio-player-container");
        if (container) {
          container.innerHTML = "";
        }

        // Handle existing recording from context
        if (currentRecording?.audioUrl && container && isMounted) {
          const audioElement = document.createElement("audio");
          audioElement.src = currentRecording.audioUrl;
          audioElement.controls = true;
          audioElement.className = "w-full mt-4";
          container.appendChild(audioElement);
          return;
        }

        // If we already have a blob from recording, don't try to fetch from server
        if (audioBlob && container) {
          const url = URL.createObjectURL(audioBlob);
          audioUrlRef.current = url;

          const audioElement = document.createElement("audio");
          audioElement.src = url;
          audioElement.controls = true;
          audioElement.className = "w-full mt-4";
          container.appendChild(audioElement);
          return;
        }

        // Check if we have a recording for this question from the context
        if (hasExistingRecording && container) {
          const audioElement = document.createElement("audio");
          audioElement.src = currentRecording.audioUrl;
          audioElement.controls = true;
          audioElement.className = "w-full mt-4";
          container.innerHTML = ""; // Clear existing content
          container.appendChild(audioElement);
          return;
        }

        // Fetch recording for current question from server
        if (
          user &&
          container &&
          isMounted &&
          !audioBlob &&
          !hasExistingRecording
        ) {
          const userId = user.id || user.username || user.email?.split('@')[0];
          const audioUrl = `/api/audio/${userId}/${questionIndex + 1}`;

          // Show loading state
          container.innerHTML = `
            <div class="flex items-center justify-center p-4 text-slate-400">
              <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Loading audio...
            </div>
          `;

          // Create and configure audio element
          const audioElement = document.createElement("audio");
          audioElement.src = audioUrl;
          audioElement.controls = true;
          audioElement.style.width = "100%";
          audioElement.style.marginTop = "1rem";
          audioElement.style.display = "none"; // Hide initially

          // Handle successful load
          audioElement.addEventListener("loadeddata", () => {
            if (container && isMounted) {
              container.innerHTML = ""; // Clear loading indicator
              audioElement.style.display = "block";
              container.appendChild(audioElement);
              audioUrlRef.current = audioUrl;
            }
          });

          // Handle load error - show "No recording available"
          audioElement.addEventListener("error", (e) => {
            if (container && isMounted) {
              container.innerHTML = `
                <div class="text-center text-slate-400 p-4">
                  No recording available for this question
                </div>
              `;
              // Only log actual errors, not expected "no recording" cases
              if (e.error) {
                console.error("Audio loading error:", e.error);
              }
            }
          });


          const showNoRecordingMessage = (container: Element) => {
            if (container) {
              container.innerHTML = `
                <div class="text-center text-slate-400 p-4">
                  No recording available for this question
                </div>
              `;
            }
          };


          // Start loading the audio
          container.appendChild(audioElement);
        }
      } catch (error) {
        console.error("Error loading question audio:", error);
      }
    };

    loadQuestionAudio();

    return () => {
      isMounted = false;
      // Only revoke object URL if we're changing questions and it's not a blob we just created
      if (audioUrlRef.current && !audioBlob) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [questionIndex, user, audioBlob, hasExistingRecording, currentRecording]);

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

    mediaRecorderRef.current.onstop = async () => {
      try {
        // First, let's check what the MediaRecorder is using
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        console.log("MediaRecorder MIME type:", mimeType);

        // Create the blob with audio data
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });
        console.log("Created audio blob of size:", audioBlob.size, "bytes");
        setAudioBlob(audioBlob);
        setIsRecording(false);

        if (!user) {
          setError("No user found - please log in");
          return;
        }

        if (!audioBlob || audioBlob.size === 0) {
          setError("No recording data captured - please try again");
          return;
        }

        // Log the blob content to verify we have audio data
        console.log("Audio chunks collected:", audioChunksRef.current.length);
        audioChunksRef.current.forEach((chunk, index) => {
          console.log(`Chunk ${index} size: ${chunk.size} bytes`);
        });

        // Create filename for the recording with MP3 extension (server will handle conversion)
        const fileName = `question${questionIndex + 1}_${new Date().getTime()}.mp3`;

        try {
          // First try to delete any existing recording
          const userName = `${user.firstName}_${user.lastName}`;
          const formData = new FormData();
          formData.append("audio", audioBlob, fileName);
          formData.append("questionIndex", (questionIndex + 1).toString());
          formData.append("userName", userName);
          formData.append("type", "recording"); // This is the required field for the server

          try {
            const deleteResponse = await fetch(`/api/storage/delete`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userName,
                questionIndex: questionIndex + 1,
                type: "recording",
              }),
            });

            // Wait for delete operation to complete regardless of result
            await deleteResponse.text();
          } catch (deleteError) {
            console.error("Error during delete operation:", deleteError);
            // Continue with upload even if delete fails
          }

          // Log all fields in the FormData for debugging
          console.log("FormData fields:");
          for (const pair of formData.entries()) {
            if (pair[1] instanceof Blob || pair[1] instanceof File) {
              console.log(
                `${pair[0]}: [Blob/File] size=${pair[1].size} type=${pair[1].type}`,
              );
            } else {
              console.log(`${pair[0]}: ${pair[1]}`);
            }
          }

          // Send upload request
          console.log("Sending actual upload request...");
          // Add more logging to track the upload process
          console.log(
            `Uploading audio for user ${userName}, question ${questionIndex + 1}`,
          );
          console.log(
            `Audio blob size: ${audioBlob.size} bytes, type: ${audioBlob.type}`,
          );

          const response = await fetch("/api/storage/upload", {
            method: "POST",
            // Do NOT set Content-Type header - browser will set it with boundary for FormData
            body: formData,
          });

          const responseText = await response.text();
          console.log("Raw server response:", responseText);

          let data;
          try {
            data = JSON.parse(responseText);
            console.log("Parsed server response:", data);
          } catch (e) {
            console.error("Failed to parse server response as JSON:", e);
            throw new Error(`Server returned invalid JSON: ${responseText}`);
          }

          if (!response.ok || !data.success) {
            throw new Error(
              `Upload failed: ${data.error || response.statusText}`,
            );
          }

          // Create blob URL for the recording
          const url = URL.createObjectURL(audioBlob);
          audioUrlRef.current = url;

          // Create a new audio element and set its properties
          const audioElement = document.createElement("audio");
          audioElement.src = url;
          audioElement.controls = true;
          audioElement.className = "w-full mt-4";

          // Update the container with the new audio element and clear any "No recording" message
          const container = document.querySelector(".audio-player-container");
          if (container) {
            container.innerHTML = ""; // Clear existing content
            container.appendChild(audioElement);
          }

          // Save the recording to the interview context
          if (data.success) {
            // Create recording object that matches the expected format in InterviewContext
            const recordingData = {
              questionIndex,
              audioUrl: url, // Use local blob URL for immediate playback
              transcript: transcript || "", // Use transcript if available
            };

            console.log("Saving recording to context:", recordingData);

            // Add to interview context using the correct method
            addRecording(recordingData);

            // Log success for debugging
            console.log("Recording saved to interview context");
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
      {currentRecording?.transcript && (
        <div className="mt-8">
          <div className="bg-slate-600/50 p-4 rounded-lg">
            <h4 className="text-md font-medium mb-2">Transcript:</h4>
            <p className="text-slate-300">
              {currentRecording.transcript}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}