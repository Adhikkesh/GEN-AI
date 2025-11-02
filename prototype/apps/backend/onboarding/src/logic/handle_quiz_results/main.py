import functions_framework
import firebase_admin
from firebase_admin import auth
from google.cloud import firestore
import google.cloud.firestore
import vertexai
from vertexai.generative_models import GenerativeModel, Part, HarmCategory, HarmBlockThreshold
import json
import os

# --- INITIALIZATION ---
PROJECT_ID = "rock-idiom-475618-q4"
LOCATION = "asia-south1"
GEMINI_MODEL = "gemini-2.5-flash"

try:
    firebase_admin.initialize_app()
except ValueError:
    pass

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

vertexai.init(project=PROJECT_ID, location=LOCATION)
db = firestore.Client()

safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}
gemini_model = GenerativeModel(GEMINI_MODEL, safety_settings=safety_settings)

# --- SHARED HELPER FUNCTIONS (Copied) ---
    
def _call_gemini(prompt, file_part=None):
    """Helper to call Gemini, with safety checks."""
    try:
        print(f"--- DEBUG: Calling Gemini...")
        if file_part:
            response = gemini_model.generate_content([prompt, file_part])
        else:
            response = gemini_model.generate_content(prompt)
        
        if not response.text:
            print(f"--- DEBUG (ERROR): Gemini response was blocked or empty. Feedback: {response.prompt_feedback}")
            return None
        
        clean_response = response.text.strip().replace("`", "").replace("json", "")
        return clean_response
    except Exception as e:
        print(f"--- DEBUG (ERROR): Error calling Gemini: {e}")
        return None

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
        
def _get_roadmap(career_name, skill_gaps):
    """Generates a learning roadmap for a specific career."""
    print(f"--- DEBUG: Generating roadmap for {career_name}...")
    if not skill_gaps:
        return [{"step": 1, "title": "You're all set!", "skills_covered": [], "description": "You already have the core skills for this role.", "resources": []}]
    
    prompt = f"""
    You are an expert career coach. A user wants to become a "{career_name}".
    They are missing the following skills: {json.dumps(skill_gaps)}.
    Create a step-by-step learning roadmap. Respond *only* in this exact JSON format (a list of steps):
    [
      {{"step": 1, "title": "Learning Topic 1", "skills_covered": ["Skill A"],
        "description": "Why this step is important.",
        "resources": ["Resource example 1", "Resource example 2"]
      }}
    ]
    """
    roadmap_json = _call_gemini(prompt)
    if not roadmap_json:
        return []
        
    try:
        return json.loads(roadmap_json)
    except json.JSONDecodeError as e:
        print(f"--- DEBUG (ERROR): Failed to parse roadmap JSON: {e}")
        return []

# --- MAIN FUNCTION ---
@functions_framework.http
def handle_quiz_results(request):
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # === Standard CORS Header ===
    headers = {'Access-Control-Allow-Origin': '*'}
    
    # 1. Authenticate user
    try:
        auth_header = request.headers.get('Authorization')
        id_token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(id_token)
        user_id = decoded_token['uid']
    except Exception as e:
        return f"Authentication error: {e}", 403, headers

    # 2. Get request data
    try:
        data = request.get_json()
        # --- THIS IS THE FIX ---
        skills_list = data.get('final_skills') 
        
        if not skills_list:
            return "Bad Request: Missing 'final_skills'", 400, headers
        # --- END FIX ---
            
    except Exception as e:
        return f"Bad Request: Invalid JSON: {e}", 400, headers

    try:
        # 3. STEP 1: Skills are provided.
        print(f"--- DEBUG: Skills provided from quiz: {skills_list}")

        # 4. STEP 2: Get Recommendations
        analysis_data = _get_recommendations(skills_list)
        if not analysis_data:
            return "Analysis failed: Could not get recommendations.", 500, headers

        # 5. STEP 3: Get Roadmaps (in a loop)
        for rec in analysis_data.get("recommendations", []):
            roadmap = _get_roadmap(rec.get("career"), rec.get("skill_gaps"))
            rec["roadmap"] = roadmap

        # 6. STEP 4: Save EVERYTHING to Firestore
        final_data_to_save = {
            "skills": skills_list,
            "recommendations": analysis_data.get("recommendations"),
            "last_updated_from": "quiz",
            "last_updated": firestore.SERVER_TIMESTAMP
        }
        
        db.collection('users').document(user_id).set(final_data_to_save, merge=True)
        print(f"--- DEBUG (SUCCESS): Full quiz pipeline complete for {user_id}")
        
        # 7. Return the final result
        del final_data_to_save["last_updated"] # Fix JSON serializable error
        return final_data_to_save, 200, headers

    except Exception as e:
        print(f"--- DEBUG (CRASH): Full pipeline error: {e}")
        return f"Internal Server Error: {e}", 500, headers