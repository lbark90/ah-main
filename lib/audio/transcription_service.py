
from google.cloud import speech_v1
import os

def transcribe_audio(audio_file_path, user_id=None):
    client = speech_v1.SpeechClient()

    # Read the audio file
    with open(audio_file_path, 'rb') as audio_file:
        content = audio_file.read()

    # Configure the recognition
    audio = speech_v1.RecognitionAudio(content=content)
    config = speech_v1.RecognitionConfig(
        encoding=speech_v1.RecognitionConfig.AudioEncoding.MP3,
        sample_rate_hertz=44100,
        language_code="en-US",
        enable_automatic_punctuation=True
    )

    # Perform the transcription
    response = client.recognize(config=config, audio=audio)

    # Combine all transcriptions
    transcript = ""
    for result in response.results:
        transcript += result.alternatives[0].transcript + " "

    return transcript.strip()
