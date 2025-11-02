import functions_framework
import firebase_admin
from firebase_admin import auth
from google.cloud import storage
import logging

# --- INITIALIZATION ---
PROJECT_ID = "rock-idiom-475618-q4"
RESUME_BUCKET_NAME = "your-project-id-resumes"  # UPDATE IF NEEDED

try:
    firebase_admin.initialize_app()
except ValueError:
    pass  # Already initialized

storage_client = storage.Client()

# --- MAIN FUNCTION WITH CORS ---
@functions_framework.http
def upload_resume(request):
    # === CORS Preflight Handling ===
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # === Standard CORS Response Headers ===
    headers = {
        'Access-Control-Allow-Origin': '*'
    }

    # 1. Authenticate User
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return ("Missing or invalid Authorization header", 403, headers)
        
        id_token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(id_token)
        user_id = decoded_token['uid']
    except Exception as e:
        logging.error(f"Auth failed: {e}")
        return (f"Authentication failed: {e}", 403, headers)

    # 2. Check for File
    if 'file' not in request.files:
        return ("Bad Request: No 'file' part in multipart form.", 400, headers)

    file = request.files['file']
    if file.filename == '':
        return ("Bad Request: No file selected.", 400, headers)

    try:
        # 3. Upload to GCS
        filename = file.filename
        blob_name = f"{user_id}/{filename}"

        bucket = storage_client.bucket(RESUME_BUCKET_NAME)
        blob = bucket.blob(blob_name)

        logging.info(f"Uploading {filename} for user {user_id} to gs://{RESUME_BUCKET_NAME}/{blob_name}")

        blob.upload_from_file(
            file.stream,
            content_type=file.content_type or 'application/octet-stream'
        )

        logging.info("Upload successful.")

        # 4. Return Success
        response = {
            "status": "success",
            "message": "Resume uploaded successfully.",
            "path": f"gs://{RESUME_BUCKET_NAME}/{blob_name}",
            "filename": filename
        }
        return (response, 200, headers)

    except Exception as e:
        logging.exception("Upload failed")
        return (f"Upload failed: {str(e)}", 500, headers)