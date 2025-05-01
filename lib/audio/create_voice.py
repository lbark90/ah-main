import os
import numpy as np
import torch
import datetime
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
import soundfile as sf
from google.cloud import storage
import json

class VoiceCreator:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
        self.model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h").to(self.device)

    def process_audio(self, audio_path):
        try:
            import subprocess
            import tempfile

            # Create a temporary WAV file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
                temp_wav_path = temp_wav.name

            # Convert to WAV using ffmpeg
            subprocess.run([
                'ffmpeg', '-y', '-i', audio_path,
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                temp_wav_path
            ], check=True, capture_output=True)

            # Read the converted WAV file
            audio, sample_rate = sf.read(temp_wav_path)
            os.remove(temp_wav_path)

            # Convert stereo to mono if needed
            if len(audio.shape) > 1:
                audio = audio.mean(axis=1)

            # Resample to 16kHz if needed
            if sample_rate != 16000:
                from scipy import signal
                audio = signal.resample(audio, int(len(audio) * 16000 / sample_rate))

            return audio

        except Exception as e:
            print(f"Error processing audio file {audio_path}: {str(e)}")
            return None

    def create_voice(self, user_id, name):
        try:
            # Initialize Google Cloud Storage client with default credentials
            storage_client = storage.Client()
            bucket = storage_client.bucket('memorial-voices')
            
            # Check if voice already exists
            voice_id = f"voice_{user_id}_{name.replace(' ', '_').lower()}"
            voice_blob = bucket.blob(f"{name.replace(' ', '_')}/voice/{voice_id}.wav")
            
            if voice_blob.exists():
                print(f"Voice already exists for {name}")
                return voice_id

            name_parts = name.split()
            prefix = f"{name_parts[0]}_{name_parts[1]}"
            blobs = list(bucket.list_blobs(prefix=prefix))

            print(f"Creating voice for user {user_id} with name {name}")
            voice_id = f"voice_{user_id}_{name.replace(' ', '_').lower()}"
            processed_audio = []

            print(f"Found {len(blobs)} audio files in GCP bucket")
            processed_count = 0
            for blob in blobs:
                if blob.name.endswith(('.wav', '.mp3', '.webm')):
                    print(f"Processing file {processed_count + 1}/{len(blobs)}: {blob.name}")
                    import tempfile
                    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(blob.name)[1]) as tmp_file:
                        temp_path = tmp_file.name
                        blob.download_to_filename(temp_path)
                        audio = self.process_audio(temp_path)
                        if audio is not None:
                            processed_audio.append(audio)
                            print(f"Successfully processed {blob.name}")
                        else:
                            print(f"Failed to process {blob.name}")
                        try:
                            os.remove(temp_path)
                        except OSError as e:
                            print(f"Warning: Could not remove temporary file {temp_path}: {e}")
                    processed_count += 1
            print(f"Completed processing {processed_count} files")

            if processed_audio and any(audio is not None for audio in processed_audio):
                # Filter out None values and combine valid audio
                valid_audio = [audio for audio in processed_audio if audio is not None]
                if valid_audio:
                    combined_audio = np.concatenate(valid_audio)
                    output_path = f"storage/voices/{voice_id}.wav"
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)

                    # Save processed audio
                    sf.write(output_path, combined_audio, 16000, format='WAV', subtype='PCM_16')
                else:
                    print("No valid audio files were processed successfully")
                    return None

                # Upload to GCS
                voice_filename = f"{voice_id}.wav"
                gcs_path = f"{name.replace(' ', '_')}/voice/{voice_filename}"
                voice_blob = bucket.blob(gcs_path)

                try:
                    voice_blob.upload_from_filename(output_path)
                    print(f"Voice file successfully uploaded to GCS at path: {gcs_path}")

                    # Create a voice_id.json file to store the voice ID
                    voice_id_json = {
                        "voice_id": voice_id,
                        "created_at": f"{datetime.datetime.now().isoformat()}"
                    }
                    
                    # Save the voice ID JSON file locally
                    json_output_path = f"storage/voices/{user_id}_voice_id.json"
                    with open(json_output_path, 'w') as f:
                        json.dump(voice_id_json, f)
                        
                    # Upload the voice ID JSON file to GCS
                    json_gcs_path = f"{user_id}/voice_id/voice_id.json"
                    json_blob = bucket.blob(json_gcs_path)
                    json_blob.upload_from_filename(json_output_path)
                    
                    # Verify upload
                    if voice_blob.exists():
                        print(f"Voice created and verified in GCS: {voice_id}")
                        print(f"Voice ID JSON file created at: {json_gcs_path}")
                        return voice_id
                    else:
                        raise Exception("Upload verification failed")
                except Exception as e:
                    print(f"Error uploading to GCS: {str(e)}")
                    raise e

            else:
                print("No audio files found to process")
                return None

        except Exception as e:
            print(f"Error creating voice: {str(e)}")
            raise e

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python create_voice.py <user_id> <name>")
        sys.exit(1)

    creator = VoiceCreator()
    creator.create_voice(sys.argv[1], sys.argv[2])