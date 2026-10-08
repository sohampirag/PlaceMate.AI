import os
import sys
import json

# Add parent directory to sys.path so app imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.supabase_client import (
    get_supabase_client,
    db_save_user,
    db_save_resume,
    db_save_practice_session,
    db_save_job
)

def seed_database():
    print("[+] Starting database seeding for PlaceMate.AI...")
    client = get_supabase_client()
    
    # 1. Obtain a valid user_id from existing public.users or create/query via Supabase Auth
    user_id = None
    user_email = "demo.placemate@gmail.com"
    
    print("[1/5] Checking / Creating User Profile...")
    try:
        users_query = client.table("users").select("*").limit(1).execute()
        if users_query.data:
            user_id = users_query.data[0]["id"]
            user_email = users_query.data[0]["email"]
            print(f"   Using existing public.users profile: {user_email} (ID: {user_id})")
        else:
            # 1a. Try signing up
            try:
                auth_res = client.auth.sign_up({"email": user_email, "password": "Password123!"})
                if auth_res and auth_res.user:
                    user_id = auth_res.user.id
                    print(f"   Auth user created: {user_email} (ID: {user_id})")
            except Exception as auth_e:
                # 1b. If already registered, sign in to get user ID
                try:
                    signin_res = client.auth.sign_in_with_password({"email": user_email, "password": "Password123!"})
                    if signin_res and signin_res.user:
                        user_id = signin_res.user.id
                        print(f"   Signed in existing user: {user_email} (ID: {user_id})")
                except Exception as signin_e:
                    # 1c. Known fallback ID created during initial setup
                    user_id = "fb942814-f988-42c0-bf0e-eed537165801"
                    print(f"   Using fallback registered auth ID: {user_id}")

            if user_id:
                try:
                    user_res = client.table("users").upsert({
                        "id": user_id,
                        "name": "Alex Johnson",
                        "email": user_email,
                        "target_role": "Full Stack Developer"
                    }).execute()
                    print(f"   User profile saved: {user_res.data}")
                except Exception as upsert_e:
                    print(f"   User profile upsert note: {upsert_e}")
    except Exception as e:
        print(f"   User fetch/insert note: {e}")

    if not user_id:
        print("[!] Warning: Could not find or create a valid user in auth.users. Seeding requires a valid user_id in production mode.")
        return

    # 2. Seed Resume
    print("[2/5] Seeding Resume Record...")
    sample_resume_analysis = {
        "score": 88,
        "fixes": [
            "Quantify achievements in your work experience (e.g., improved load time by 35%).",
            "Add a dedicated section for Cloud Architecture and AWS/GCP skills."
        ],
        "weak_topics": ["Docker & Kubernetes", "System Design", "GraphQL"]
    }
    resume_res = db_save_resume(
        extracted_text="Alex Johnson - Full Stack Engineer with 3 years experience in React, Node.js, and Python...",
        analysis=sample_resume_analysis,
        file_url="alex_johnson_resume.pdf",
        user_id=user_id
    )
    print(f"   Resume seeded: {resume_res}")

    # 3. Seed Aptitude Session
    print("[3/5] Seeding Aptitude Practice Session...")
    aptitude_submissions = [
        {
            "question": {"id": 1, "question": "If a train travels 60 km/h, how far does it travel in 45 minutes?", "category": "Quantitative"},
            "user_answer": "45 km",
            "is_correct": True,
            "ai_feedback": {"feedback": "Correct calculation!"}
        },
        {
            "question": {"id": 2, "question": "What is the next number in sequence: 2, 4, 8, 16, ...?", "category": "Logical"},
            "user_answer": "32",
            "is_correct": True,
            "ai_feedback": {"feedback": "Correct powers of 2!"}
        }
    ]
    apt_session = db_save_practice_session(
        session_type="aptitude",
        score=90.0,
        total_questions=10,
        submissions=aptitude_submissions,
        user_id=user_id
    )
    print(f"   Aptitude session seeded: {apt_session}")

    # 4. Seed Coding Session
    print("[4/5] Seeding Coding Practice Session...")
    coding_submissions = [
        {
            "question": {"id": "c1", "title": "Two Sum", "difficulty": "Easy"},
            "user_answer": "def twoSum(nums, target):\n    lookup = {}\n    for i, n in enumerate(nums):\n        if target - n in lookup:\n            return [lookup[target - n], i]\n        lookup[n] = i\n    return []",
            "is_correct": True,
            "ai_feedback": {"score": 95, "feedback": "Optimal O(N) time complexity solution with hash map."}
        }
    ]
    coding_session = db_save_practice_session(
        session_type="coding",
        score=95.0,
        total_questions=1,
        submissions=coding_submissions,
        user_id=user_id
    )
    print(f"   Coding session seeded: {coding_session}")

    # 5. Seed Saved Jobs
    print("[5/5] Seeding Saved Jobs...")
    jobs_to_seed = [
        {
            "id": "job-101",
            "title": "Senior Frontend Developer",
            "company": "Stripe",
            "location": "San Francisco, CA (Remote)",
            "url": "https://stripe.com/jobs/101",
            "status": "interviewing"
        },
        {
            "id": "job-102",
            "title": "Full Stack Engineer",
            "company": "Vercel",
            "location": "Remote",
            "url": "https://vercel.com/careers/102",
            "status": "saved"
        },
        {
            "id": "job-103",
            "title": "AI Platform Engineer",
            "company": "OpenAI",
            "location": "San Francisco, CA",
            "url": "https://openai.com/careers/103",
            "status": "applied"
        }
    ]
    for j in jobs_to_seed:
        job_res = db_save_job(j, user_id=user_id)
        print(f"   Saved job seeded: {job_res}")

    print("\n[SUCCESS] Database Seeding Completed Successfully!")

if __name__ == "__main__":
    seed_database()
