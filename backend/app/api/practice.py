from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.ai.question_generator import (
    generate_aptitude_questions, 
    generate_coding_questions, 
    evaluate_coding_submission,
    handle_coding_chat,
    generate_report_feedback
)
from app.db.supabase_client import db_save_practice_session, db_get_practice_sessions

router = APIRouter()

# --- Aptitude Models & Endpoints ---
class AptitudeQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_option_index: int
    category: str

@router.get("/aptitude")
async def get_aptitude_questions(target_role: str = "Software Engineer"):
    """Generates a list of aptitude questions via LLM."""
    questions = await generate_aptitude_questions(target_role, count=20)
    return questions

class AptitudeSubmission(BaseModel):
    questions: List[dict]
    answers: dict[int, int] # question_id -> selected_option_index
    user_id: Optional[str] = None

@router.post("/aptitude/submit")
async def submit_aptitude(submission: AptitudeSubmission):
    """Grades the aptitude assessment and saves session to Supabase database."""
    score = 0
    total = len(submission.questions)
    submissions_list = []

    for q in submission.questions:
        q_id = q.get("id")
        user_ans_idx = submission.answers.get(q_id)
        is_correct = (user_ans_idx == q.get("correct_option_index"))
        if is_correct:
            score += 1

        submissions_list.append({
            "question": q,
            "user_answer": str(user_ans_idx) if user_ans_idx is not None else "",
            "is_correct": is_correct,
            "ai_feedback": {"selected_option": user_ans_idx, "correct_option": q.get("correct_option_index")}
        })

    percentage = (score / total) * 100 if total > 0 else 0

    # Save to Supabase DB
    db_session = db_save_practice_session(
        session_type="aptitude",
        score=percentage,
        total_questions=total,
        submissions=submissions_list,
        user_id=submission.user_id
    )

    return {
        "score": percentage,
        "correct": score,
        "total": total,
        "saved_in_db": db_session is not None
    }

@router.get("/coding")
async def get_coding_questions(target_role: str = "Software Engineer"):
    """Generates coding practice questions via LLM."""
    questions = await generate_coding_questions(target_role)
    return questions

class CodingSubmission(BaseModel):
    question: dict
    code: str
    user_id: Optional[str] = None

@router.post("/coding/submit")
async def submit_coding(submission: CodingSubmission):
    """
    Submits code for evaluation using the LLM and saves session to Supabase database.
    """
    result = await evaluate_coding_submission(submission.question, submission.code)
    
    overall_score = float(result.get("score", 70))
    is_correct = overall_score >= 70

    # Save to Supabase DB
    db_session = db_save_practice_session(
        session_type="coding",
        score=overall_score,
        total_questions=1,
        submissions=[{
            "question": submission.question,
            "user_answer": submission.code,
            "is_correct": is_correct,
            "ai_feedback": result
        }],
        user_id=submission.user_id
    )

    return {
        **result,
        "saved_in_db": db_session is not None
    }

class ChatMessage(BaseModel):
    role: str
    content: str

class CodingChatRequest(BaseModel):
    messages: List[ChatMessage]
    target_role: str = "Software Engineer"

@router.post("/coding/chat")
async def coding_chat(request: CodingChatRequest):
    """
    Handles ChatGPT-style DSA discussions.
    """
    response_msg = await handle_coding_chat([msg.model_dump() for msg in request.messages], request.target_role)
    return response_msg

class ReportRequest(BaseModel):
    target_role: str
    scores: dict

@router.post("/report/generate")
async def get_report_feedback(request: ReportRequest):
    improvements = await generate_report_feedback(request.target_role, request.scores)
    return {"improvements": improvements}

@router.get("/history")
async def get_practice_history(user_id: Optional[str] = Query(None)):
    """
    Retrieves saved practice session history from Supabase DB.
    """
    sessions = db_get_practice_sessions(user_id=user_id)
    return {"sessions": sessions}

