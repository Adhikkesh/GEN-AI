import functions_framework
import firebase_admin
from firebase_admin import auth
from google.cloud import firestore
import json
import logging

# --- INITIALIZATION ---
try:
    firebase_admin.initialize_app()
except ValueError:
    pass  # Already initialized

db = firestore.Client()

# --- MAIN FUNCTION WITH CORS ---
@functions_framework.http
def select_career(request):
    # === CORS Preflight Handling ===
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # === Standard Response Headers ===
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

    # 2. Parse Request Body
    try:
        data = request.get_json(silent=True)
        if not data:
            return ("Bad Request: Empty or invalid JSON body", 400, headers)

        career_title = data.get('career_title')
        if not career_title or not isinstance(career_title, str):
            return ("Bad Request: 'career_title' is required and must be a string", 400, headers)

    except Exception as e:
        return (f"Bad Request: Invalid JSON: {e}", 400, headers)

    try:
        # 3. Fetch User Document
        doc_ref = db.collection('users').document(user_id)
        doc_snapshot = doc_ref.get()

        if not doc_snapshot.exists:
            return (f"User profile not found for {user_id}. Run resume analysis first.", 404, headers)

        doc_data = doc_snapshot.to_dict()
        recommendations = doc_data.get('recommendations', [])

        if not recommendations:
            return ("No career recommendations found. Analyze resume first.", 400, headers)

        # 4. Find Selected Career
        selected_rec = next(
            (rec for rec in recommendations if rec.get('career', '').strip() == career_title.strip()),
            None
        )

        if not selected_rec:
            available = [rec.get('career') for rec in recommendations]
            return (
                f"Career '{career_title}' not found. Available: {available}",
                404,
                headers
            )

        # 5. Update Firestore with Selection
        update_data = {
            "selected_career": career_title.strip(),
            "selected_gaps": selected_rec.get('skill_gaps', []),
            "selected_roadmap": selected_rec.get('roadmap', []),
            "last_selection_date": firestore.SERVER_TIMESTAMP
        }

        doc_ref.update(update_data)

        logging.info(f"User {user_id} selected career: {career_title}")

        # 6. Return Success
        response = {
            "status": "success",
            "message": f"Career '{career_title}' selected successfully.",
            "career": career_title,
            "skill_gaps": selected_rec.get('skill_gaps', []),
            "roadmap": selected_rec.get('roadmap', [])
        }
        return (response, 200, headers)

    except Exception as e:
        logging.exception("select_career failed")
        return (f"Internal Server Error: {str(e)}", 500, headers)