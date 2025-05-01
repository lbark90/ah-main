import os
import sys
import json
import datetime
from google.cloud import storage

def check_voice_file(user_id):
    try:
        # Initialize Google Cloud Storage client
        storage_client = storage.Client.from_service_account_json('google_credentials.json')
        bucket = storage.Bucket(storage_client, 'memorial-voices')

        # Special handling for lbark90 - always return the hardcoded voice ID first
        if user_id == 'lbark90':
            voice_id = 'BqVolG55J1XdqIXpATx4'
            print(f"Using hardcoded ElevenLabs voice ID for user {user_id}: {voice_id}")
            # Create or update the voice_id.json file to ensure it exists
            try:
                voice_id_path = f"{user_id}/voice_id/voice_id.json"
                voice_id_blob = bucket.blob(voice_id_path)
                if not voice_id_blob.exists():
                    voice_id_data = {
                        "userId": user_id,
                        "user_voice_id": voice_id,
                        "created_at": datetime.datetime.now().isoformat()
                    }
                    voice_id_blob.upload_from_string(
                        json.dumps(voice_id_data),
                        content_type='application/json'
                    )
                    print(f"Created voice_id.json with ID {voice_id}")
            except Exception as e:
                print(f"Warning: Could not create/update voice_id.json: {e}")
            # Always return the hardcoded voice ID for this user
            return True, voice_id, None

        # Check for voice ID file for other users
        voice_id_path = f"{user_id}/voice_id/voice_id.json"
        try:
            voice_id_blob = bucket.blob(voice_id_path)
            if voice_id_blob.exists():
                voice_id_content = voice_id_blob.download_as_text()
                voice_id_data = json.loads(voice_id_content)
                print(f"Voice ID file found: {voice_id_data}")

                # Check for ElevenLabs voice_id field
                if 'user_voice_id' in voice_id_data:
                    voice_id = voice_id_data['user_voice_id']
                    print(f"Found ElevenLabs voice ID: {voice_id}")
                    # This is an ElevenLabs voice ID, we'll just return it directly
                    return True, voice_id, None
                elif 'voice_id' in voice_id_data:
                    voice_id = voice_id_data['voice_id']
                    print(f"Found voice ID: {voice_id}")
                    return True, voice_id, None
                else:
                    print("Voice ID file does not contain voice_id field")
                    voice_id = None
            else:
                print(f"Voice ID file not found at {voice_id_path}")
                voice_id = None
        except Exception as e:
            print(f"Error checking for voice ID: {e}")
            voice_id = None

        # List all blobs in user's directory to help debug
        blobs = list(bucket.list_blobs(prefix=f"{user_id}/"))
        print(f"All files under {user_id}/:")
        for blob in blobs:
            print(f"  - {blob.name}")

        return False, None, None

    except Exception as e:
        print(f"Error checking voice file: {str(e)}")
        return False, None, None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_voice_file.py <user_id>")
        sys.exit(1)

    user_id = sys.argv[1]
    exists, voice_id, voice_path = check_voice_file(user_id)

    result = {
        "exists": exists,
        "voiceId": voice_id,
        "voicePath": voice_path,
        "isElevenLabsVoice": (voice_id is not None)
    }

    print(json.dumps(result, indent=2))