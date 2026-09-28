from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class JobListing(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str
    url: str

@router.get("/match", response_model=List[JobListing])
async def match_jobs(target_role: str = "Software Engineer", skills: str = ""):
    """
    Fetches job listings based on the user's target role and skills.
    This is a mock implementation. In a real app, you would call an external API like Adzuna or Jooble.
    """
    # Mock data based on typical searches
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
