import functions_framework
import firebase_admin
from firebase_admin import auth
from google.cloud import storage
import os

# --- INITIALIZATION ---
PROJECT_ID = "rock-idiom-475618-q4"
# --- !! IMPORTANT !! ---
# This MUST match the bucket name in your handle_resume function
RESUME_BUCKET_NAME = "your-project-id-resumes" # TODO: Update this
# --- !! IMPORTANT !! ---

try:
    firebase_admin.initialize_app()
except ValueError:
    pass # App already initialized

storage_client = storage.Client()

# --- MAIN FUNCTION ---
@functions_framework.http
def upload_resume(request):
    # 1. Authenticate user (This is critical)
    try:
        auth_header = request.headers.get('Authorization')
        id_token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(id_token)
        user_id = decoded_token['uid']
    except Exception as e:
        return f"Authentication error: {e}", 403

    # 2. Get the file from the request
    # This code expects the file to be sent as 'multipart/form-data'
    if 'file' not in request.files:
        return "Bad Request: No 'file' found in the request.", 400

    file = request.files['file']

    if file.filename == '':
        return "Bad Request: No file selected.", 400

    try:
        # 3. Define the path and upload the file
        filename = file.filename
        blob_name = f"{user_id}/{filename}"

        bucket = storage_client.bucket(RESUME_BUCKET_NAME)
        blob = bucket.blob(blob_name)

        print(f"--- DEBUG: Uploading file {filename} to {blob_name}")

        # Upload the file stream directly from memory
        blob.upload_from_file(file.stream, content_type=file.content_type)

        print(f"--- DEBUG: Upload successful.")

        # 4. Send a success response
        return {"status": "success", "path": blob_name}, 200

    except Exception as e:
        print(f"--- DEBUG (CRASH): {e}")
        return f"Internal Server Error: {e}", 500