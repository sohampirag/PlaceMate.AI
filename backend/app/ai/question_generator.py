from app.config import settings
import json
from groq import AsyncGroq

client = AsyncGroq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None

async def generate_aptitude_questions(target_role: str, count: int = 5):
    """
    Generates dynamic aptitude questions based on the target role.
    Returns a list containing the questions.
    """
    if not client:
        # Fallback if no API key
        return [
            {"id": 1, "question": "If 2x + y = 10 and x - y = 2, what is the value of x?", "options": ["2", "3", "4", "5"], "correct_option_index": 2, "category": "Quantitative"}
        ]
        
    system_prompt = (
        f"You are an AI assistant generating aptitude questions for a {target_role} placement test. "
        f"CRITICAL INSTRUCTION: You MUST generate EXACTLY {count} multiple-choice questions. "
        "Do not generate 5 questions. Do not generate 10 questions. You must generate exactly 20 questions in the array. "
        "The questions must cover Quantitative, Logical Reasoning, and Verbal ability. "
        "Return the result strictly as a JSON object with a single key 'questions' containing the array of 20 objects. "
        "Each object must have: "
        "'id' (integer), 'question' (string), 'options' (array of 4 strings), 'correct_option_index' (integer 0-3), and 'category' (string)."
    )
    
    try:
        response = await client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Generate the questions."}
            ],
            response_format={"type": "json_object"},
            max_tokens=4000
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("questions", [])
    except Exception as e:
        print(f"Error generating aptitude questions: {e}")
        return []

async def generate_coding_questions(target_role: str, count: int = 2):
    """
    Generates dynamic coding questions based on the target role.
    """
    if not client:
        return [
            {
                "id": 1, "title": "Two Sum", 
                "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.", 
                "starter_code": "def two_sum(nums, target):\n    # write your code here\n    pass"
            }
        ]
        
    system_prompt = (
        f"You are an AI assistant generating coding interview questions for a {target_role}. "
        f"Generate {count} coding questions. "
        "Return the result strictly as a JSON object with a single key 'questions' containing an array of objects. "
        "Each object must have: "
        "'id' (integer), 'title' (string), 'description' (string), 'starter_code' (string in Python)."
    )
    
    try:
        response = await client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Generate the questions."}
            ],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("questions", [])
    except Exception as e:
        print(f"Error generating coding questions: {e}")
        return []

async def evaluate_coding_submission(question_data: dict, user_code: str):
    """
    Uses LLM to evaluate if the submitted code is correct.
    """
    if not client:
        return {"status": "success", "score": 100, "feedback": "Mock evaluation passed."}
        
    system_prompt = (
        "You are an expert technical interviewer evaluating a candidate's code submission. "
        "You will be given the original question and the user's code. "
        "Determine if the code correctly solves the problem. "
        "Return a JSON object with: "
        "'score' (0-100), 'status' ('success' or 'failed'), and 'feedback' (a short string explaining what's right/wrong)."
    )
    
    try:
        response = await client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Question: {json.dumps(question_data)}\n\nUser Code:\n{user_code}"}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"status": "error", "score": 0, "feedback": str(e)}

async def handle_coding_chat(messages: list, target_role: str):
    """
    Handles conversational interactions for the DSA/Coding round.
    """
    if not client:
        return {"role": "assistant", "content": "Mock response: This is how you solve the problem..."}
        
    system_prompt = (
        f"You are an expert technical interviewer and DSA mentor for a {target_role} position. "
        "The user is here for coding practice, but instead of writing code in an editor, they will discuss "
        "data structures, algorithms, and system design with you. "
        "Answer their questions, guide them on how to approach common interview problems, and provide code snippets if requested."
    )
    
    formatted_messages = [{"role": "system", "content": system_prompt}]
    
    # Add previous conversation history
    for msg in messages:
        if msg.get("role") in ["user", "assistant"]:
            formatted_messages.append({"role": msg.get("role"), "content": msg.get("content")})
            
    try:
        response = await client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=formatted_messages,
            # No JSON formatting needed for normal chat
        )
        return {"role": "assistant", "content": response.choices[0].message.content}
    except Exception as e:
        print(f"Error in coding chat: {e}")
        return {"role": "assistant", "content": f"Sorry, I encountered an error: {e}"}

async def generate_report_feedback(target_role: str, scores: dict):
    """
    Generates personalized areas for improvement based on mock scores.
    """
    if not client:
        return [
            {"title": "System Design (Technical)", "description": "Your answers lacked specific architectural patterns. Review microservices vs monolith trade-offs."},
            {"title": "Quantitative (Aptitude)", "description": "Speed needs improvement on algebra questions. Practice timed sections."}
        ]
        
    system_prompt = (
        f"You are an AI career coach generating feedback for a candidate applying for {target_role}. "
        f"The candidate has the following mock scores: {json.dumps(scores)}. "
        "Generate 2 specific areas for improvement. "
        "Return the result strictly as a JSON object with a single key 'improvements' containing an array of exactly 2 objects. "
        "Each object must have: "
        "'title' (string, e.g. 'System Design (Technical)'), 'description' (string, short actionable feedback)."
    )
    
    try:
        response = await client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Generate the feedback."}
            ],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("improvements", [])
    except Exception as e:
        print(f"Error generating feedback: {e}")
        return []
