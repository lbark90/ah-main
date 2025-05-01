from google.cloud import storage
import os

def upload_file_to_gcp(file_path: str, user_id: str, file_type: str):
    """
    Uploads a file to GCP with user-specific folder structure.
    file_type should be either 'recordings' or 'photos'
    """
    try:
        # Initialize storage client with default credentials
        storage_client = storage.Client()
        
        # Get bucket reference without fetching its metadata
        bucket_name = 'memorial-voices'
        bucket = storage_client.bucket(bucket_name)
        
        # Create user-specific path
        file_name = os.path.basename(file_path)
        destination_blob_name = f'{user_id}/{file_type}/{file_name}'
        
        # Upload file
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(file_path)
        
        print(f"File {file_path} uploaded to {destination_blob_name}")
        return {
            'success': True,
            'path': destination_blob_name
        }
        
    except Exception as e:
        print(f"Error uploading to bucket: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
