from fastapi import APIRouter,HTTPException,Depends
from fastapi.responses import StreamingResponse
from models.chat_models import ChatMessage
from services.chat_service import stream_chat,get_user_sessions,delete_session
from services.rag_service import rag_chat,get_user_pdfs
from auth.auth_handler import get_current_user
from app.database import get_db
from datetime import datetime

router=APIRouter()

@router.post("/stream")
async def chat_stream(data:ChatMessage,user=Depends(get_current_user)):
    from services.chat_service import get_or_create_session
    session_id = await get_or_create_session(user["id"], data.session_id)
    return StreamingResponse(
        stream_chat(user["id"],data.message,session_id),
        media_type="text/event-stream",
        headers={"X-Session-Id": session_id}
    )

@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id:str,user=Depends(get_current_user)):
    db=get_db()
    session=await db.sessions.find_one({"session_id":session_id,"user_id":user["id"]})
    if not session:
        raise HTTPException(status_code=404,detail="Session not found")
    return [
        {"role":m["role"],"content":m["content"],"timestamp":str(m.get("timestamp",""))[:16]}
        for m in session.get("messages",[])
    ]

@router.post("/rag-stream")
async def rag_stream(data:ChatMessage,user=Depends(get_current_user)):
    from services.chat_service import get_or_create_session
    session_id = await get_or_create_session(user["id"], data.session_id)
    return StreamingResponse(
        rag_chat(user["id"],data.message,session_id),
        media_type="text/event-stream",
        headers={"X-Session-Id": session_id}
    )

@router.get("/sessions")
async def sessions(user=Depends(get_current_user)):
    return await get_user_sessions(user["id"])

@router.delete("/sessions/{session_id}")
async def delete(session_id:str,user=Depends(get_current_user)):
    await delete_session(user["id"],session_id)
    return {"message":"Session deleted"}

@router.get("/pdfs")
async def pdfs(user=Depends(get_current_user)):
    return await get_user_pdfs(user["id"])