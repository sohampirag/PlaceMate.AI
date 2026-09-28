import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # AI & Voice APIs
    SARVAM_API_KEY: str = ""
    CARTESIA_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    
    # External Job API
    JOB_API_KEY: str = ""
    JOB_API_URL: str = ""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
