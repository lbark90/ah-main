import os
import sys
import json
import requests
import base64
from google.cloud import storage
from google.cloud.storage import Blob
import google.generativeai as genai
from text_to_speech import synthesize_text

class ConversationHandler:
    def __init__(self):
        # Initialize Google Cloud Storage client
        try:
            self.storage_client = storage.Client()  # Use default credentials
            self.bucket_name = os.getenv('GCP_BUCKET_NAME', 'memorial-voices')
            self.bucket = self.storage_client.bucket(self.bucket_name)
            
            # Initialize Gemini API
            api_key = os.getenv('GEMINI_API_KEY')
            if api_key:
                genai.configure(api_key=api_key)
            
            # ElevenLabs API key
            self.elevenlabs_api_key = os.getenv('ELEVEN_LABS_API')
            
            # Conversation state storage
            self.conversation_state = {}
            self.user_profiles = {}
            
            print("ConversationHandler initialized successfully")
        except Exception as e:
            print(f"Error initializing ConversationHandler: {str(e)}", file=sys.stderr)
            raise e

    def get_voice_id(self, user_id):
        """Get the ElevenLabs voice ID for a user from GCS bucket"""
        try:
            # Special case for testing user
            if user_id == 'lbark90':
                return 'BqVolG55J1XdqIXpATx4'
                
            # Check for voice ID in standard location
            voice_id_path = f"{user_id}/voice_id/voice_id.json"
            voice_id_blob = self.bucket.blob(voice_id_path)
            
            if voice_id_blob.exists():
                content = voice_id_blob.download_as_string()
                data = json.loads(content)
                print(f"Voice ID file data: {data}")
                
                # Check for voice_id or user_voice_id
                if 'voice_id' in data:
                    return data['voice_id']
                elif 'user_voice_id' in data:
                    return data['user_voice_id']
            
            # Check alternative locations
            alt_paths = [
                f"{user_id}_voice_id.json",
                f"voices/{user_id}_voice_id.json",
                f"storage/voices/{user_id}_voice_id.json"
            ]
            
            for path in alt_paths:
                blob = self.bucket.blob(path)
                if blob.exists():
                    content = blob.download_as_string()
                    data = json.loads(content)
                    if 'voice_id' in data:
                        return data['voice_id']
                    elif 'user_voice_id' in data:
                        return data['user_voice_id']
            
            print(f"No voice ID found for user: {user_id}")
            return None
        except Exception as e:
            print(f"Error getting voice ID: {str(e)}", file=sys.stderr)
            return None

    def get_user_profile(self, user_id):
        """Get the user's profile data from GCS bucket"""
        try:
            # Check if profile is already loaded
            if user_id in self.user_profiles:
                return self.user_profiles[user_id]
                
            profile_data = {
                "name": user_id,
                "profile_text": "",
                "voice_id": self.get_voice_id(user_id)
            }
            
            # Try to load profile.txt
            profile_path = f"{user_id}/profile.txt"
            profile_blob = self.bucket.blob(profile_path)
            
            if profile_blob.exists():
                profile_data["profile_text"] = profile_blob.download_as_text()
            
            # Try to load metadata.json for additional info
            metadata_path = f"{user_id}/metadata.json"
            metadata_blob = self.bucket.blob(metadata_path)
            
            if metadata_blob.exists():
                metadata = json.loads(metadata_blob.download_as_text())
                if "name" in metadata:
                    profile_data["name"] = metadata["name"]
            
            # Cache the profile data
            self.user_profiles[user_id] = profile_data
            return profile_data
        except Exception as e:
            print(f"Error loading profile: {str(e)}", file=sys.stderr)
            return {
                "name": user_id,
                "profile_text": "",
                "voice_id": self.get_voice_id(user_id)
            }

    def process_user_input(self, user_id, user_text):
        """Process user input text and generate response"""
        try:
            # Get user profile
            profile = self.get_user_profile(user_id)
            
            # Prepare context for Gemini
            persona_name = profile.get("name", "Memorial Persona")
            persona_profile = profile.get("profile_text", "")
            system_prompt = f"You are the persona of {persona_name}. " \
                           f"Here is their profile:\n{persona_profile}\n" \
                           f"Answer as if you are {persona_name}, in a warm and conversational manner."
            
            # Check if we have an ongoing conversation
            if user_id not in self.conversation_state:
                # Start a new conversation
                model = genai.GenerativeModel('gemini-1.5-pro')
                chat = model.start_chat(history=[
                    {"role": "system", "parts": [system_prompt]},
                ])
                self.conversation_state[user_id] = chat
            else:
                chat = self.conversation_state[user_id]
            
            # Generate response from Gemini
            response = chat.send_message(user_text)
            assistant_text = response.text
            print(f"Gemini response for {user_id}: {assistant_text}")
            
            return assistant_text
        except Exception as e:
            print(f"Error processing user input: {str(e)}", file=sys.stderr)
            return "I'm sorry, I couldn't process that request."

    def text_to_voice(self, user_id, text):
        """Convert text to voice using ElevenLabs"""
        try:
            voice_id = self.get_voice_id(user_id)
            
            if not voice_id:
                print(f"No voice ID available for user: {user_id}")
                return None
                
            # Call ElevenLabs API
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            headers = {
                "xi-api-key": self.elevenlabs_api_key,
                "Content-Type": "application/json"
            }
            data = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.75,
                    "similarity_boost": 0.75
                }
            }
            
            print(f"Calling ElevenLabs API for voice ID: {voice_id}")
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                print(f"Successfully generated voice audio ({len(response.content)} bytes)")
                return response.content
            else:
                print(f"ElevenLabs API error: {response.status_code} - {response.text}", file=sys.stderr)
                return None
        except Exception as e:
            print(f"Error in text to voice: {str(e)}", file=sys.stderr)
            return None

    def handle_conversation_turn(self, user_id, user_text):
        """Handle a full conversation turn"""
        try:
            # Step 1: Process user input with Gemini
            assistant_text = self.process_user_input(user_id, user_text)
            
            # Step 2: Convert response to voice with ElevenLabs
            audio_content = self.text_to_voice(user_id, assistant_text)
            
            return {
                "text": assistant_text,
                "audio": audio_content
            }
        except Exception as e:
            print(f"Error in conversation turn: {str(e)}", file=sys.stderr)
            return {
                "text": "I'm sorry, there was an error processing your request.",
                "audio": None
            }
