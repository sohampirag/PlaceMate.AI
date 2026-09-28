from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

# --- Aptitude Models & Endpoints ---
class AptitudeQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_option_index: int
    category: str

from app.ai.question_generator import generate_aptitude_questions, generate_coding_questions, evaluate_coding_submission

@router.get("/aptitude")
async def get_aptitude_questions(target_role: str = "Software Engineer"):
    """Generates a list of aptitude questions via LLM."""
    questions = await generate_aptitude_questions(target_role, count=20)
    return questions

class AptitudeSubmission(BaseModel):
    questions: List[dict]
    answers: dict[int, int] # question_id -> selected_option_index

@router.post("/aptitude/submit")
async def submit_aptitude(submission: AptitudeSubmission):
    """Grades the aptitude assessment based on the provided questions and answers."""
    score = 0
    total = len(submission.questions)
    for q in submission.questions:
        q_id = q.get("id")
        if submission.answers.get(q_id) == q.get("correct_option_index"):
            score += 1
    
    percentage = (score / total) * 100 if total > 0 else 0
    return {"score": percentage, "correct": score, "total": total}

@router.get("/coding")
async def get_coding_questions(target_role: str = "Software Engineer"):
    """Generates coding practice questions via LLM."""
    questions = await generate_coding_questions(target_role)
    return questions

class CodingSubmission(BaseModel):
    question: dict
    code: str

@router.post("/coding/submit")
async def submit_coding(submission: CodingSubmission):
    """
    Submits code for evaluation using the LLM.
    """
    result = await evaluate_coding_submission(submission.question, submission.code)
    return result

class ChatMessage(BaseModel):
    role: str
    content: str

class CodingChatRequest(BaseModel):
    messages: List[ChatMessage]
    target_role: str = "Software Engineer"

from app.ai.question_generator import handle_coding_chat

@router.post("/coding/chat")
async def coding_chat(request: CodingChatRequest):
    """
    Handles ChatGPT-style DSA discussions.
    """
    response_msg = await handle_coding_chat([msg.model_dump() for msg in request.messages], request.target_role)
    return response_msg
