import functions_framework
import firebase_admin
from firebase_admin import auth
from google.cloud import firestore
import google.cloud.firestore
import vertexai
from vertexai.generative_models import GenerativeModel, Part, HarmCategory, HarmBlockThreshold
import json
import os
import requests 

# --- INITIALIZATION ---
PROJECT_ID = "rock-idiom-475618-q4"
LOCATION = "asia-south1"
GEMINI_MODEL = "gemini-2.5-flash"

# --- !! CORRECT & SECURE !! ---
# Read the token from an environment variable
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
# --- !! CORRECT & SECURE !! ---

try:
    firebase_admin.initialize_app()
except ValueError:
    pass # App already initialized

vertexai.init(project=PROJECT_ID, location=LOCATION)
db = firestore.Client() # <-- Fixed with capital 'C'

# --- Define safety settings to block nothing ---
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}
gemini_model = GenerativeModel(GEMINI_MODEL, safety_settings=safety_settings)

# --- SHARED HELPER FUNCTIONS ---
    
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
        
        # Clean up markdown fences
        clean_response = response.text.strip().replace("`", "").replace("json", "")
        return clean_response
    except Exception as e:
        print(f"--- DEBUG (ERROR): Error calling Gemini: {e}")
        return None

def _get_recommendations(skills_list):
    """Generates recommendations and gaps from a list of skills."""
    print(f"--- DEBUG: Getting recommendations for skills: {skills_list}")
    prompt = f"""
    You are an expert career and HR analyst. A user has these skills: {json.dumps(skills_list)}.
    1. What are the top 3 best-fit career paths?
    2. For *each*, what are the top 5 essential skills they are *missing*?
    Respond *only* in this exact JSON format:
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

# --- NEW GITHUB FETCHER ---
def _get_github_data(username):
    """Fetches repository data from the GitHub API."""
    if not GITHUB_TOKEN:
        print("--- DEBUG (CRASH): GITHUB_TOKEN environment variable is not set.")
        # Raise an exception to stop the function
        raise ValueError("GITHUB_TOKEN is not configured.")

    print(f"--- DEBUG: Fetching GitHub data for {username}")
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    # Get the user's 30 most recently pushed repos
    url = f"https://api.github.com/users/{username}/repos?sort=pushed&per_page=30"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() # Raises an error for bad responses (4xx, 5xx)
        repos = response.json()
        
        # Combine the most important text data
        data_for_analysis = []
        for repo in repos:
            repo_text = f"Repo: {repo.get('name')}, Description: {repo.get('description')}, Language: {repo.get('language')}"
            data_for_analysis.append(repo_text)
            
        print(f"--- DEBUG: Found {len(data_for_analysis)} repos.")
        if not data_for_analysis:
            return None # User exists but has no public repos
            
        return "\n".join(data_for_analysis)
        
    except requests.exceptions.HTTPError as http_err:
        if response.status_code == 404:
            print(f"--- DEBUG (ERROR): GitHub user not found: {username}")
            return None # User not found
        print(f"--- DEBUG (ERROR): HTTP error fetching GitHub data: {http_err}")
        return None
    except Exception as e:
        print(f"--- DEBUG (ERROR): Other error fetching GitHub data: {e}")
        return None

# --- MAIN FUNCTION ---
@functions_framework.http
def handle_github(request):
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
        github_username = data.get('githubUsername')
        if not github_username:
            return "Bad Request: Missing 'githubUsername'", 400
    except Exception as e:
        return f"Bad Request: Invalid JSON: {e}", 400

    try:
        # 3. STEP 1A: Fetch real GitHub data
        github_text = _get_github_data(github_username)
        if not github_text:
            return f"Analysis failed: Could not find GitHub user '{github_username}' or user has no public repos.", 404

        # 3. STEP 1B: Extract Skills from the fetched text
        skill_prompt = f"""
        You are an expert tech recruiter. Analyze the following text, which contains
        a user's GitHub repository names, descriptions, and languages.
        Extract a list of their most likely technical skills.
        
        Data:
        {github_text}
        
        Respond *only* in this exact JSON format: 
        {{"skills": ["Skill 1", "Skill 2"]}}
        """
        
        skills_json = _call_gemini(skill_prompt)
        if not skills_json:
            return "Analysis failed: Could not extract skills.", 500
        
        skills_data = json.loads(skills_json)
        skills_list = skills_data.get("skills", [])
        if not skills_list:
            return "Analysis complete: No specific skills were identified from the profile.", 200

        # 4. STEP 2: Get Recommendations
        analysis_data = _get_recommendations(skills_list)
        if not analysis_data:
            return "Analysis failed: Could not get recommendations.", 500

        # 5. STEP 3: Get Roadmaps (in a loop)
        for rec in analysis_data.get("recommendations", []):
            roadmap = _get_roadmap(rec.get("career"), rec.get("skill_gaps"))
            rec["roadmap"] = roadmap

        # 6. STEP 4: Save EVERYTHING to Firestore
        final_data_to_save = {
            "skills": skills_list,
            "recommendations": analysis_data.get("recommendations"),
            "last_updated_from": "github",
            "last_updated": firestore.SERVER_TIMESTAMP
        }
        
        db.collection('users').document(user_id).set(final_data_to_save, merge=True)
        print(f"--- DEBUG (SUCCESS): Full GitHub pipeline complete for {user_id}")
        
        # 7. Return the final result
        del final_data_to_save["last_updated"] # <-- Fix for JSON serializable error
        return final_data_to_save, 200

    except Exception as e:
        print(f"--- DEBUG (CRASH): Full pipeline error: {e}")
        return f"Internal Server Error: {e}", 500