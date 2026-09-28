from supabase import create_client, Client
from app.config import settings

def get_supabase_client() -> Client:
    """
    Returns an initialized Supabase client using credentials from settings.
    Ensure SUPABASE_URL and SUPABASE_KEY are set in the .env file.
    """
    url: str = settings.SUPABASE_URL
    key: str = settings.SUPABASE_KEY
    if not url or not key:
        raise ValueError("Supabase URL and Key must be provided in the environment variables.")
    return create_client(url, key)
