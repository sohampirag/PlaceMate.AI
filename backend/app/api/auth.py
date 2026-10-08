from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.supabase_client import get_supabase_client, db_save_user

router = APIRouter()

class UserSyncRequest(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    target_role: Optional[str] = "Software Engineer"

@router.post("/sync")
async def sync_user_endpoint(request: UserSyncRequest):
    """
    Syncs a logged-in user profile to public.users table.
    Uses backend client to ensure reliable insertion bypassing client-side RLS constraints.
    """
    user = db_save_user(
        email=request.email,
        name=request.name,
        target_role=request.target_role,
        user_id=request.user_id
    )
    return {"status": "success", "user": user}

@router.post("/sync_all")
async def sync_all_registered_users():
    """
    Utility endpoint to backfill any existing accounts in auth.users into public.users table.
    """
    try:
        client = get_supabase_client()
        # Query auth users using admin service API if available, or RPC
        auth_users_res = client.auth.admin.list_users()
        synced_count = 0
        if auth_users_res:
            for u in auth_users_res:
                user_id = u.id
                email = u.email
                name = u.user_metadata.get("name") if u.user_metadata else email.split("@")[0]
                res = db_save_user(email=email, name=name, user_id=user_id)
                if res:
                    synced_count += 1
        return {"status": "success", "synced_users": synced_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
