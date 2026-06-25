from core.config import settings
from datetime import datetime

langfuse = None

def init_langfuse():
    global langfuse
    if not settings.LANGFUSE_PUBLIC_KEY or not settings.LANGFUSE_SECRET_KEY:
        print("Langfuse not configured — skipping.")
        return
    try:
        from langfuse import Langfuse
        langfuse = Langfuse(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            host=settings.LANGFUSE_HOST
        )
        print("Langfuse connected!")
    except Exception as e:
        print(f"Langfuse init failed: {e}")

def track(user_id: str, session_id: str, input: str):
    if not langfuse:
        return None
    try:
        return langfuse.trace(
            name="baatkaro-chat",
            user_id=user_id,
            session_id=session_id,
            input=input,
            metadata={"timestamp": str(datetime.utcnow())}
        )
    except Exception:
        return None

def track_rag(user_id: str, session_id: str, input: str, chunks: int):
    if not langfuse:
        return None
    try:
        return langfuse.trace(
            name="baatkaro-rag",
            user_id=user_id,
            session_id=session_id,
            input=input,
            metadata={"chunks_retrieved": chunks, "timestamp": str(datetime.utcnow())}
        )
    except Exception:
        return None

def flush():
    if langfuse:
        try:
            langfuse.flush()
        except Exception:
            pass
