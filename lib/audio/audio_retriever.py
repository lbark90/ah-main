import os
import sys
from google.cloud import storage

def get_audio_file(user_email: str, question_number: str):
    try:
        storage_client = storage.Client.from_service_account_json('google_credentials.json')
        bucket = storage_client.bucket('memorial-voices')
        
        # List files in the user's recordings folder for this question
        prefix = f"{user_email}/recordings/question{question_number}/"
        blobs = bucket.list_blobs(prefix=prefix)
        
        # Filter for MP3 files and get the latest recording
        mp3_blobs = [blob for blob in blobs if blob.name.lower().endswith('.mp3')]
        
        if not mp3_blobs:
            print(f"No MP3 files found for user {user_email}, question {question_number}", file=sys.stderr)
            # Try to find any audio files as fallback
            blobs = list(bucket.list_blobs(prefix=prefix))
            latest_blob = None
            for blob in blobs:
                if latest_blob is None or blob.time_created > latest_blob.time_created:
                    latest_blob = blob
        else:
            # Get the latest MP3 recording
            latest_blob = None
            for blob in mp3_blobs:
                if latest_blob is None or blob.time_created > latest_blob.time_created:
                    latest_blob = blob
                
        if latest_blob:
            print(f"Found audio file: {latest_blob.name}", file=sys.stderr)
            return latest_blob.download_as_bytes()
        
        print(f"No audio files found for user {user_email}, question {question_number}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error retrieving audio: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: audio_retriever.py <user_email> <question_number>")
        sys.exit(1)
        
    audio_data = get_audio_file(sys.argv[1], sys.argv[2])
    if audio_data:
        sys.stdout.buffer.write(audio_data)
