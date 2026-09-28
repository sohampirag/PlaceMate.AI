from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pymupdf
from app.ai.resume_analyzer import analyze_resume

router = APIRouter()

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), target_role: str = Form("Software Engineer")):
    """
    Endpoint to upload a resume (PDF) and extract text.
    Returns the extracted text and LLM analysis of the resume.
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
        
        return {
            "filename": file.filename,
            "extracted_text_length": len(text),
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
