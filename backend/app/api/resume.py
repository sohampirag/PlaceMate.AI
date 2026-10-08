from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
import pymupdf
from typing import Optional
from app.ai.resume_analyzer import analyze_resume
from app.db.supabase_client import db_save_resume, db_get_resumes

router = APIRouter()

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), target_role: str = Form("Software Engineer"), user_id: Optional[str] = Form(None)):
    """
    Endpoint to upload a resume (PDF), extract text, analyze with LLM, and persist to Supabase database.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        contents = await file.read()
        doc = pymupdf.Document(stream=contents, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        
        # Analyze resume using LLM
        analysis = await analyze_resume(text, target_role)
        
        # Save record to Supabase DB
        db_record = db_save_resume(
            extracted_text=text,
            analysis=analysis,
            file_url=file.filename,
            user_id=user_id
        )
        
        return {
            "filename": file.filename,
            "extracted_text_length": len(text),
            "analysis": analysis,
            "saved_in_db": db_record is not None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_resume_history(user_id: Optional[str] = Query(None)):
    """
    Retrieves saved resume analysis history from Supabase DB.
    """
    resumes = db_get_resumes(user_id=user_id)
    return {"resumes": resumes}

