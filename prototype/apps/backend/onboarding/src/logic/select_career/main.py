import functions_framework
import firebase_admin
from firebase_admin import auth
from google.cloud import firestore
import json
import os

# --- INITIALIZATION ---
try:
    firebase_admin.initialize_app()
except ValueError:
    pass

db = firestore.Client()

# --- MAIN FUNCTION ---
@functions_framework.http
def select_career(request):
    # 1. Authenticate user
    try:
        auth_header = request.headers.get('Authorization')
        id_token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(id_token)
        user_id = decoded_token['uid']
    except Exception as e:
        return f"Authentication error: {e}", 403

    # 2. Get request data
    try:
        data = request.get_json()
        career_title = data.get('career_title')
        if not career_title:
            return "Bad Request: Missing 'career_title'", 400
    except Exception as e:
        return f"Bad Request: Invalid JSON: {e}", 400

    try:
        doc_ref = db.collection('users').document(user_id)
        doc_snapshot = doc_ref.get()

        if not doc_snapshot.exists:
            return f"Error: User document not found for {user_id}", 404

        doc_data = doc_snapshot.to_dict()
        recommendations = doc_data.get('recommendations', [])

        # 3. Find the selected career's data
        selected_rec = next(
            (rec for rec in recommendations if rec.get('career') == career_title),
            None
        )

        if not selected_rec:
            return f"Error: Career '{career_title}' not found in recommendations.", 404

        # 4. Save the selection and related data
        doc_ref.update({
            "selected_career": career_title,
            "selected_gaps": selected_rec.get('skill_gaps', []),
            "selected_roadmap": selected_rec.get('roadmap', []),
            "last_selection_date": firestore.SERVER_TIMESTAMP
        })

        print(f"--- DEBUG (SUCCESS): Career '{career_title}' selected for {user_id}")
        return {"status": "success", "career": career_title}, 200

    except Exception as e:
        print(f"--- DEBUG (CRASH): Error: {e}")
        return f"Internal Server Error: {e}", 500