from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.db.supabase_client import db_save_job, db_get_saved_jobs, db_delete_saved_job

router = APIRouter()

class JobListing(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str
    url: str

class SaveJobRequest(BaseModel):
    id: str
    title: str
    company: str
    location: str
    url: Optional[str] = ""
    status: Optional[str] = "saved"
    user_id: Optional[str] = None

@router.get("/match", response_model=List[JobListing])
async def match_jobs(target_role: str = "Software Engineer", skills: str = ""):
    """
    Fetches job listings based on the user's target role and skills.
    """
    mock_jobs = [
        JobListing(
            id="job123",
            title=f"Junior {target_role}",
            company="Tech Innovators Inc.",
            location="Remote",
            description="We are looking for an enthusiastic entry-level engineer to join our growing team.",
            url="https://example.com/jobs/123"
        ),
        JobListing(
            id="job124",
            title=f"{target_role}",
            company="Global Solutions LLC",
            location="New York, NY",
            description=f"Requires strong skills in {skills if skills else 'relevant technologies'}.",
            url="https://example.com/jobs/124"
        ),
        JobListing(
            id="job125",
            title=f"Associate {target_role}",
            company="Startup XYZ",
            location="San Francisco, CA (Hybrid)",
            description="Fast-paced environment looking for fresh graduates.",
            url="https://example.com/jobs/125"
        )
    ]
    return mock_jobs

@router.post("/save")
async def save_job_endpoint(request: SaveJobRequest):
    """
    Saves a job to the user's saved_jobs table in Supabase DB.
    """
    saved = db_save_job(request.model_dump(), user_id=request.user_id)
    return {"status": "success", "saved_job": saved}

@router.get("/saved")
async def get_saved_jobs_endpoint(user_id: Optional[str] = Query(None)):
    """
    Fetches saved jobs from Supabase DB.
    """
    jobs = db_get_saved_jobs(user_id=user_id)
    return {"jobs": jobs}

@router.delete("/saved/{job_id}")
async def delete_saved_job_endpoint(job_id: str, user_id: Optional[str] = Query(None)):
    """
    Deletes a saved job from Supabase DB.
    """
    success = db_delete_saved_job(job_id=job_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete job")
    return {"status": "success"}

