from core.config import settings
import io

async def transcribe(audio_bytes:bytes,filename:str="audio.webm")->str:
    from groq import Groq
    client=Groq(api_key=settings.GROQ_API_KEY)
    
    bio=io.BytesIO(audio_bytes)
    bio.name=filename
    
    transcription=client.audio.transcriptions.create(
        file=bio,
        model="whisper-large-v3",
        response_format="text"
    )
    if hasattr(transcription, "text"):
        return transcription.text
    return str(transcription)