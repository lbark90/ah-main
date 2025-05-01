
import os
import sys
from google.cloud import storage

def get_audio_file(user_email: str, question_number: str):
    try:
        storage_client = storage.Client.from_service_account_json('google_credentials.json')
        bucket = storage_client.bucket('memorial-voices')
        
        # List files in the user's recordings folder
        prefix = f"{user_email}/recordings/question{question_number}/"
        blobs = bucket.list_blobs(prefix=prefix)
        
        # Get the latest recording
        latest_blob = None
        for blob in blobs:
            if latest_blob is None or blob.time_created > latest_blob.time_created:
                latest_blob = blob
                
        if latest_blob:
            return latest_blob.download_as_bytes()
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
