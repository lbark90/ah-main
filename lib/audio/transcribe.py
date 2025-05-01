
from google.cloud import speech_v1
import os
import argparse

def transcribe_audio(audio_file_path: str, user_id: str, question_number: int):
    """
    Transcribe audio using Google Cloud Speech-to-Text
    """
    try:
        client = speech_v1.SpeechClient()

        with open(audio_file_path, 'rb') as audio_file:
            content = audio_file.read()

        audio = speech_v1.RecognitionAudio(content=content)
        
        config = speech_v1.RecognitionConfig(
            encoding=speech_v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            language_code="en-US",
            enable_automatic_punctuation=True,
        )

        response = client.recognize(config=config, audio=audio)
        
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + " "
            
        return transcript.strip()
        
    except Exception as e:
        print(f"Error transcribing audio: {str(e)}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True, help="Path to audio file")
    parser.add_argument("--user", required=True, help="User ID")
    parser.add_argument("--question", required=True, help="Question number")
    
    args = parser.parse_args()
    
    transcript = transcribe_audio(args.audio, args.user, int(args.question))
    if transcript:
        print(f"Transcription: {transcript}")
