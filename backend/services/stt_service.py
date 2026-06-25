from core.config import settings
async def transcribe(audio_bytes:bytes,filename:str="audio.webm")->str:
    from groq import Groq
    client=Groq(api_key=settings.GROQ_API_KEY)
    transcription=client.audio.transcriptions.create(
        file=(filename,audio_bytes),
        model="whisper-large-v3",
        response_format="text"
    )
    return transcription