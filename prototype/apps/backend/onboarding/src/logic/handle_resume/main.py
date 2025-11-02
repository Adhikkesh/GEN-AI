import functions_framework
import firebase_admin
from firebase_admin import auth
from google.cloud import firestore, storage
import vertexai
from vertexai.generative_models import GenerativeModel, Part, HarmCategory, HarmBlockThreshold
import json
import logging
from flask import Flask

# --- INITIALIZATION ---
PROJECT_ID = "rock-idiom-475618-q4"
LOCATION = "asia-south1"
GEMINI_MODEL = "gemini-2.5-flash"
RESUME_BUCKET_NAME = "your-project-id-resumes"  # UPDATE IF NEEDED

# Initialize Firebase (idempotent)
try:
    firebase_admin.initialize_app()
except ValueError:
    pass

# --- NEW: Load Career Catalog ---
CAREERS_CATALOG = {}
try:
    with open('careers.json', 'r') as f:
        careers_list = json.load(f)
        # Create a simple {CareerName: [skills]} dictionary for the prompt
        CAREERS_CATALOG = {career['displayName']: career['skills'] for career in careers_list}
    print(f"--- DEBUG: Successfully loaded {len(CAREERS_CATALOG)} careers from catalog.")
except Exception as e:
    print(f"--- DEBUG (CRITICAL ERROR): Failed to load careers.json: {e}")
# --- END NEW ---

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Clients
db = firestore.Client()
storage_client = storage.Client()

# Safety settings (allow all for internal use)
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

gemini_model = GenerativeModel(GEMINI_MODEL, safety_settings=safety_settings)

# --- HELPER: Call Gemini ---
def _call_gemini(prompt: str, file_part: Part = None) -> str | None:
    try:
        logging.info("Calling Gemini...")
        content = [prompt]
        if file_part:
            content.append(file_part)
        
        response = gemini_model.generate_content(content)
        
        if not response.text:
            logging.warning(f"Gemini blocked response: {response.prompt_feedback}")
            return None
            
        # Clean response
        text = response.text.strip()
        text = text.replace("```json", "").replace("```", "").replace("json", "").strip()
        return text
    except Exception as e:
        logging.error(f"Gemini call failed: {e}")
        return None

# --- HELPER: Get Career Recommendations ---
def _get_recommendations(skills_list):
    """Generates recommendations and gaps from a list of skills using a fixed catalog."""
    print(f"--- DEBUG: Getting recommendations for skills: {skills_list}")

    # If the catalog failed to load, return an error
    if not CAREERS_CATALOG:
        print("--- DEBUG (CRITICAL ERROR): Career catalog is empty. Aborting analysis.")
        return None

    # Convert the catalog to a JSON string to pass to the prompt
    catalog_json = json.dumps(CAREERS_CATALOG, indent=2)

    prompt = f"""
    You are an expert career and HR analyst. You MUST follow these instructions.
    
    A user has this list of skills:
    {json.dumps(skills_list)}

    Here is your complete "Career Catalog". You MUST use this catalog exclusively. Do not invent new careers or skills.
    The catalog is a JSON object where the key is the "Career Name" and the value is the "List of Required Skills".

    --- CATALOG START ---
    {catalog_json}
    --- CATALOG END ---

    Your task:
    1.  Compare the user's skill list against the "List of Required Skills" for every career in the catalog.
    2.  Identify the top 3 "Career Names" from the catalog that are the best fit for the user.
    3.  For *each* of those 3 careers, determine the "skill_gaps". A skill gap is a skill that is in the catalog's "List of Required Skills" but NOT in the user's skill list. List the top 5 most important missing skills.
    
    Respond *only* in this exact JSON format. Do not add any other text or markdown.
    {{"recommendations": [
        {{"career": "Career 1", "skill_gaps": ["Skill A", "Skill B"]}},
        {{"career": "Career 2", "skill_gaps": ["Skill C", "Skill D"]}},
        {{"career": "Career 3", "skill_gaps": ["Skill E", "Skill F"]}}
    ]}}
    """
    
    analysis_json = _call_gemini(prompt)
    if not analysis_json:
        return None

    try:
        return json.loads(analysis_json)
    except json.JSONDecodeError as e:
        print(f"--- DEBUG (ERROR): Failed to parse recommendations JSON: {e}")
        return None

# --- HELPER: Get Learning Roadmap ---
def _get_roadmap(career_name, skill_gaps):
    prompt = f"""
You are a career coach. User wants to become a "{career_name}".
They lack: {json.dumps(skill_gaps)}.

Return ONLY a JSON array of steps:
[
  "Step 1: Learn X using Y (free/paid)",
  "Step 2: Build project Z",
  ...
]
"""
    result = _call_gemini(prompt)
    if not result:
        return []
    try:
        return json.loads(result)
    except json.JSONDecodeError:
        logging.error(f"Failed to parse roadmap: {result}")
        return []

# --- MAIN FUNCTION ---
@functions_framework.http
def handle_resume(request):
    # Enable CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {'Access-Control-Allow-Origin': '*'}

    # 1. Authenticate
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return ("Missing or invalid Authorization", 403, headers)
        id_token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(id_token)
        user_id = decoded_token['uid']
    except Exception as e:
        logging.error(f"Auth failed: {e}")
        return (f"Authentication failed: {e}", 403, headers)

    try:
        # 2. Auto-fetch resume from GCS
        bucket = storage_client.bucket(RESUME_BUCKET_NAME)
        prefix = f"{user_id}/"
        blobs = list(storage_client.list_blobs(bucket, prefix=prefix))

        resume_blob = None
        for blob in blobs:
            if blob.name == prefix:
                continue
            if blob.name.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')) or 'image/' in blob.content_type:
                resume_blob = blob
                break  # First valid resume only

        if not resume_blob:
            return (f"No resume found for user {user_id}. Upload one first.", 404, headers)

        logging.info(f"Found resume: {resume_blob.name}")

        # 3. Download & prepare for Gemini
        resume_bytes = resume_blob.download_as_bytes()
        mime_type = resume_blob.content_type or "application/pdf"
        resume_part = Part.from_data(data=resume_bytes, mime_type=mime_type)

        # 4. Extract Skills
        skill_prompt = """
You are a resume parser. Extract ALL technical and soft skills from the resume.
Return ONLY valid JSON:
{"skills": ["Python", "Machine Learning", "Teamwork", ...]}
"""
        skills_json = _call_gemini(skill_prompt, resume_part)
        if not skills_json:
            return ("Failed to extract skills.", 500, headers)

        try:
            skills_data = json.loads(skills_json)
            skills_list = skills_data.get("skills", [])
        except json.JSONDecodeError:
            return ("Invalid skills JSON from Gemini.", 500, headers)

        if not skills_list:
            return ("No skills detected in resume.", 400, headers)

        # 5. Get Recommendations + Roadmaps
        recommendations = _get_recommendations(skills_list)
        if not recommendations or "recommendations" not in recommendations:
            return ("Failed to generate career recommendations.", 500, headers)

        for rec in recommendations["recommendations"]:
            career = rec.get("career")
            gaps = rec.get("skill_gaps", [])
            roadmap = _get_roadmap(career, gaps)
            rec["roadmap"] = roadmap

        # 6. Save to Firestore
        save_data = {
            "skills": skills_list,
            "recommendations": recommendations["recommendations"],
            "last_updated_from": "resume",
            "last_updated": firestore.SERVER_TIMESTAMP
        }
        db.collection("users").document(user_id).set(save_data, merge=True)

        # 7. Return clean response
        response_data = {
            "skills": skills_list,
            "recommendations": recommendations["recommendations"]
        }
        return (json.dumps(response_data, indent=2), 200, headers)

    except Exception as e:
        logging.exception("Resume pipeline failed")
        return (f"Internal error: {str(e)}", 500, headers)