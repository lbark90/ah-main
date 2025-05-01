
import sys
import os
import json
from google.cloud import texttospeech
import json

def synthesize_text(voice_id, text):
    try:
        if not voice_id:
            print("Error: No voice_id provided", file=sys.stderr)
            sys.exit(1)
            
        if not text:
            print("Error: No text provided", file=sys.stderr)
            sys.exit(1)
            
        # Initialize client with credentials
        try:
            # First check if we have the credentials file
            if os.path.exists('google_credentials.json'):
                client = texttospeech.TextToSpeechClient.from_service_account_json('google_credentials.json')
            # If not, try to use environment variable
            elif os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
                creds_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
                try:
                    credentials_info = json.loads(creds_json)
                    client = texttospeech.TextToSpeechClient.from_service_account_info(credentials_info)
                except json.JSONDecodeError as e:
                    print(f"Error parsing credentials JSON: {str(e)}", file=sys.stderr)
                    sys.exit(1)
            else:
                print("Error: No Google credentials available", file=sys.stderr)
                sys.exit(1)
        except Exception as e:
            print(f"Error initializing text-to-speech client: {str(e)}", file=sys.stderr)
            sys.exit(1)
            
        synthesis_input = texttospeech.SynthesisInput(text=text)

        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name=voice_id if voice_id else "en-US-Standard-A"
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0,
            pitch=0.0
        )

        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )

        sys.stdout.buffer.write(response.audio_content)
    except Exception as e:
        print(f"Error in text-to-speech: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python text_to_speech.py <voice_id> <text>", file=sys.stderr)
        sys.exit(1)

    voice_id = sys.argv[1]
    text = sys.argv[2]
    synthesize_text(voice_id, text)
