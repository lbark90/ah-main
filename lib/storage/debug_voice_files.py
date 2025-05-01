import os
import sys
import json
from google.cloud import storage

def debug_voice_files(user_id):
    """Debug function to check all possible voice file locations for a user"""
    try:
        print(f"Debugging voice files for user: {user_id}")
        
        # Initialize Google Cloud Storage client
        storage_client = storage.Client()  # Use default credentials
        bucket = storage_client.bucket('memorial-voices')
        
        # Check for voice ID file (main location)
        voice_id_path = f"{user_id}/voice_id/voice_id.json"
        voice_id_exists = bucket.blob(voice_id_path).exists()
        print(f"Voice ID file at {voice_id_path}: {'EXISTS' if voice_id_exists else 'NOT FOUND'}")
        
        # If exists, download and print content
        if voice_id_exists:
            content = bucket.blob(voice_id_path).download_as_text()
            print(f"Voice ID file content: {content}")
            try:
                data = json.loads(content)
                voice_id = data.get('voice_id') or data.get('user_voice_id')
                print(f"Extracted voice ID: {voice_id}")
                
                if voice_id:
                    # Check all possible voice file locations
                    possible_paths = [
                        f"{user_id}/voice/{voice_id}.wav",
                        f"voices/{voice_id}.wav", 
                        f"voice/{voice_id}.wav",
                        f"Lawrence_Bark/voice/{voice_id}.wav",
                        f"{user_id.replace('_', ' ')}/voice/{voice_id}.wav"
                    ]
                    
                    for path in possible_paths:
                        exists = bucket.blob(path).exists()
                        print(f"Voice file at {path}: {'EXISTS' if exists else 'NOT FOUND'}")
                        
                    # If none exists, try to create hardcoded path for this specific user
                    if user_id == 'lbark90':
                        hardcoded_id = 'BqVolG55J1XdqIXpATx4'
                        print(f"Trying hardcoded voice ID for user {user_id}: {hardcoded_id}")
                        hardcoded_paths = [
                            f"{user_id}/voice/{hardcoded_id}.wav",
                            f"voices/{hardcoded_id}.wav",
                            f"voice/{hardcoded_id}.wav"
                        ]
                        for path in hardcoded_paths:
                            exists = bucket.blob(path).exists()
                            print(f"Hardcoded voice file at {path}: {'EXISTS' if exists else 'NOT FOUND'}")
            except json.JSONDecodeError:
                print(f"Error: Voice ID file contains invalid JSON")
        
        # Check alternative locations
        alt_voice_id_paths = [
            f"{user_id}_voice_id.json",
            f"voices/{user_id}_voice_id.json",
            f"storage/voices/{user_id}_voice_id.json"
        ]
        
        for path in alt_voice_id_paths:
            exists = bucket.blob(path).exists()
            print(f"Alternative voice ID file at {path}: {'EXISTS' if exists else 'NOT FOUND'}")
        
        # List all files in user's directory for debugging
        print(f"\nAll files under {user_id}/:")
        blobs = list(bucket.list_blobs(prefix=f"{user_id}/"))
        for blob in blobs:
            print(f"  - {blob.name}")
            
        print("\nAll files under voice/:")
        blobs = list(bucket.list_blobs(prefix="voice/"))
        for blob in blobs:
            print(f"  - {blob.name}")
            
        print("\nAll files under voices/:")
        blobs = list(bucket.list_blobs(prefix="voices/"))
        for blob in blobs:
            print(f"  - {blob.name}")
        
        # Add manual check to create voice_id.json if it doesn't exist for lbark90
        if user_id == 'lbark90' and not voice_id_exists:
            print(f"\nCreating voice_id.json for {user_id}")
            voice_id_json = {
                "voice_id": "BqVolG55J1XdqIXpATx4",
                "created_at": "2025-04-16T00:00:00.000Z"
            }
            
            # Upload directly to GCS
            json_blob = bucket.blob(voice_id_path)
            json_blob.upload_from_string(json.dumps(voice_id_json), content_type='application/json')
            print(f"Created voice_id.json at {voice_id_path}")
            return True
        
        return voice_id_exists
    except Exception as e:
        print(f"Error debugging voice files: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python debug_voice_files.py <user_id>")
        sys.exit(1)
        
    user_id = sys.argv[1]
    debug_voice_files(user_id)
