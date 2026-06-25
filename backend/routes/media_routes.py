from fastapi import APIRouter,HTTPException,Depends,UploadFile,File
from fastapi.responses import Response
from services.stt_service import transcribe
from services.tts_service import detect_and_synthesize
from auth.auth_handler import get_current_user

router=APIRouter()

@router.post("/stt")
async def speech_to_text(audio:UploadFile=File(...),user=Depends(get_current_user)):
    audio_bytes=await audio.read()
    text=await transcribe(audio_bytes,audio.filename)
    return {"text":text}

@router.post("/tts")
async def text_to_speech(data:dict,user=Depends(get_current_user)):
    text=data.get("text","")
    if not text:
        raise HTTPException(status_code=400,detail="Text required")
    audio=await detect_and_synthesize(text)
    return Response(content=audio,media_type="audio/mpeg")