import functions_framework
import firebase_admin
from firebase_admin import auth
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
    pass # App already initialized

vertexai.init(project=PROJECT_ID, location=LOCATION)

safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}
gemini_model = GenerativeModel(GEMINI_MODEL, safety_settings=safety_settings)

# --- This is the hard-coded first question ---
FIRST_QUESTION = {
    "next_question": {
        "id": "q1",
        "text": "What area are you most interested in?",
        "options": ["Web Development", "AI Engineering", "Cyber Security", "Blockchain"]
    }
}

# --- MAIN FUNCTION ---
@functions_framework.http
def get_dynamic_quiz(request):
    # 1. Authenticate user
    try:
        auth_header = request.headers.get('Authorization')
        id_token = auth_header.split('Bearer ')[1]
        decoded_token = auth.verify_id_token(id_token)
    except Exception as e:
        return f"Authentication error: {e}", 403

    # 2. Get request data
    try:
        data = request.get_json()
        # 'conversation_history' will be a list of answers sent by the client
        # e.g., [{"question": "What area...", "answer": "Web Development"}]
        conversation_history = data.get('conversation_history', []) 
    except Exception as e:
        return f"Bad Request: Invalid JSON: {e}", 400

    try:
        # --- If history is empty, return the first question ---
        if not conversation_history:
            print("--- DEBUG: Sending first question.")
            return FIRST_QUESTION, 200

        print(f"--- DEBUG: Getting next question based on history: {conversation_history}")

        # --- If history exists, ask Gemini for the next step ---
        prompt = f"""
        You are a friendly career counselor. Your goal is to help a user discover
        their technical skills by asking a series of multiple-choice questions.

        You will be given the conversation history so far. 
        Your job is to generate the *next single question* based on their previous answers
        to narrow down their specific skills.

        - If they choose "Web Development", ask about "Frontend vs Backend".
        - If they choose "AI Engineering", ask about "Data Science vs MLOps".
        - Keep asking 2-3 follow-up questions to find specific skills.
        - After 3-4 questions, when you have enough information to identify 
          a list of 5-10 specific skills (e.g., "Python", "React", "Network Security"), 
          STOP asking questions and return the final skill list.

        When you have enough skills, respond with this *exact* JSON:
        {{"final_skills": ["Skill 1", "Skill 2"]}}

        If you need to ask another question, respond with this *exact* JSON:
        {{"next_question": {{
            "id": "q2", 
            "text": "What's the next question?",
            "options": ["Option A", "Option B", "Option C"]
        }}}}

        This is the history (the user's last answer was the most recent):
        {json.dumps(conversation_history)}
        """

        response = gemini_model.generate_content(prompt)

        if not response.text:
            print(f"--- DEBUG (ERROR): Gemini response was blocked. Feedback: {response.prompt_feedback}")
            return "Analysis failed: Gemini response was blocked.", 500


        print(f"--- DEBUG: Raw Gemini response: {response.text}")
        clean_response = response.text.strip().replace("`", "").replace("json", "")

        next_step_data = json.loads(clean_response)
        print(f"--- DEBUG (SUCCESS): Returning next step: {next_step_data}")
        return next_step_data, 200

    except Exception as e:
        print(f"--- DEBUG (CRASH): Full pipeline error: {e}")
        return f"Internal Server Error: {e}", 500