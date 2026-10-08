import logging
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """
    Returns an initialized Supabase client using credentials from settings.
    Prefers SUPABASE_SERVICE_KEY if present (bypasses RLS for backend ops),
    otherwise falls back to SUPABASE_KEY.
    """
    url: str = settings.SUPABASE_URL
    key: str = settings.SUPABASE_SERVICE_KEY if settings.SUPABASE_SERVICE_KEY else settings.SUPABASE_KEY
    if not url or not key:
        raise ValueError("Supabase URL and Key must be provided in the environment variables.")
    return create_client(url, key)

def db_save_user(email: str, name: Optional[str] = None, target_role: Optional[str] = None, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Insert or update user profile in public.users."""
    try:
        client = get_supabase_client()
        data = {
            "email": email,
            "name": name or email.split("@")[0],
            "target_role": target_role or "Software Engineer"
        }
        if user_id:
            data["id"] = user_id
            
        res = client.table("users").upsert(data).execute()
        return res.data[0] if res.data else data
    except Exception as e:
        logger.warning(f"Failed to save user to DB: {e}")
        return None

def db_save_resume(extracted_text: str, analysis: Dict[str, Any], file_url: Optional[str] = None, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Save resume analysis to public.resumes."""
    try:
        client = get_supabase_client()
        data = {
            "file_url": file_url or "",
            "extracted_text": extracted_text[:2000] if extracted_text else "",
            "analysis": analysis
        }
        if user_id:
            data["user_id"] = user_id
            
        res = client.table("resumes").insert(data).execute()
        return res.data[0] if res.data else data
    except Exception as e:
        logger.warning(f"Failed to save resume to DB: {e}")
        return None

def db_get_resumes(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetch resumes from public.resumes."""
    try:
        client = get_supabase_client()
        query = client.table("resumes").select("*")
        if user_id:
            query = query.eq("user_id", user_id)
        res = query.order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        logger.warning(f"Failed to fetch resumes from DB: {e}")
        return []

def db_save_practice_session(session_type: str, score: float, total_questions: int, submissions: Optional[List[Dict[str, Any]]] = None, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Save practice session and individual question submissions to public.practice_sessions and public.practice_submissions."""
    try:
        client = get_supabase_client()
        session_data = {
            "type": session_type,
            "score": score,
            "total_questions": total_questions
        }
        if user_id:
            session_data["user_id"] = user_id
            
        session_res = client.table("practice_sessions").insert(session_data).execute()
        saved_session = session_res.data[0] if session_res.data else session_data
        session_id = saved_session.get("id")

        if session_id and submissions:
            sub_records = []
            for sub in submissions:
                rec = {
                    "session_id": session_id,
                    "question": sub.get("question", {}),
                    "user_answer": str(sub.get("user_answer", "")),
                    "is_correct": sub.get("is_correct", False),
                    "ai_feedback": sub.get("ai_feedback", {})
                }
                if user_id:
                    rec["user_id"] = user_id
                sub_records.append(rec)
            
            if sub_records:
                client.table("practice_submissions").insert(sub_records).execute()
                
        return saved_session
    except Exception as e:
        logger.warning(f"Failed to save practice session to DB: {e}")
        return None

def db_get_practice_sessions(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetch practice sessions from public.practice_sessions."""
    try:
        client = get_supabase_client()
        query = client.table("practice_sessions").select("*")
        if user_id:
            query = query.eq("user_id", user_id)
        res = query.order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        logger.warning(f"Failed to fetch practice sessions from DB: {e}")
        return []

def db_save_job(job_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Save a job to public.saved_jobs."""
    try:
        client = get_supabase_client()
        data = {
            "external_job_id": str(job_data.get("id", "")),
            "title": job_data.get("title", "Untitled Position"),
            "company": job_data.get("company", "Unknown"),
            "location": job_data.get("location", "Remote"),
            "url": job_data.get("url", ""),
            "status": job_data.get("status", "saved")
        }
        if user_id:
            data["user_id"] = user_id
            
        res = client.table("saved_jobs").insert(data).execute()
        return res.data[0] if res.data else data
    except Exception as e:
        logger.warning(f"Failed to save job to DB: {e}")
        return None

def db_get_saved_jobs(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetch saved jobs from public.saved_jobs."""
    try:
        client = get_supabase_client()
        query = client.table("saved_jobs").select("*")
        if user_id:
            query = query.eq("user_id", user_id)
        res = query.order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        logger.warning(f"Failed to fetch saved jobs from DB: {e}")
        return []

def db_delete_saved_job(job_id: str, user_id: Optional[str] = None) -> bool:
    """Delete a saved job from public.saved_jobs."""
    try:
        client = get_supabase_client()
        query = client.table("saved_jobs").delete().eq("id", job_id)
        if user_id:
            query = query.eq("user_id", user_id)
        query.execute()
        return True
    except Exception as e:
        logger.warning(f"Failed to delete saved job from DB: {e}")
        return False

