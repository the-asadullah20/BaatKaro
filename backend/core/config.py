from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-2"
    LLM_MODEL: str = "gemini-2.5-flash"
    GROQ_API_KEY: str
    MONGODB_URI: str
    DB_NAME: str = "baatkaro"
    JWT_SECRET: str
    JWT_EXPIRE_HOURS: int = 24
    LANGFUSE_PUBLIC_KEY: Optional[str] = None
    LANGFUSE_SECRET_KEY: Optional[str] = None
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"
    GOOGLE_PROJECT_ID: str = ""
    GOOGLE_CLOUD_REGION: str = "us-central1"
    GCS_BUCKET_NAME: str = "baatkaro-faiss"

    class Config:
        env_file = ".env"

settings = Settings()
