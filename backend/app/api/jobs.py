import os
import httpx
from dotenv import load_dotenv

load_dotenv()

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
    Fetches job listings based on the user's target role and skills from Adzuna API (India only).
    """
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    if not app_id or not app_key:
        raise HTTPException(status_code=500, detail="Adzuna API credentials not configured.")

    # Adzuna API URL for India (country code 'in')
    url = "https://api.adzuna.com/v1/api/jobs/in/search/1"
    
    # Combine target_role and skills for the search query
    search_query = f"{target_role} {skills}".strip()
    
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": search_query,
        "results_per_page": 10,
        "content-type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail="Error fetching jobs from Adzuna")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    results = data.get("results", [])
    
    jobs = []
    for job in results:
        jobs.append(
            JobListing(
                id=str(job.get("id")),
                title=job.get("title", "Unknown Title"),
                company=job.get("company", {}).get("display_name", "Unknown Company"),
                location=job.get("location", {}).get("display_name", "Unknown Location"),
                description=job.get("description", ""),
                url=job.get("redirect_url", "")
            )
        )
        
    return jobs

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

