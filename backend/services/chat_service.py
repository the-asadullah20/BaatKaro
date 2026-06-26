from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage,AIMessage,SystemMessage
from app.database import get_db
from core.config import settings
from services.langfuse_service import track
from datetime import datetime
import uuid

llm=ChatGoogleGenerativeAI(
    model=settings.LLM_MODEL,
    google_api_key=settings.GEMINI_API_KEY,
    streaming=True
)

SYSTEM_PROMPT="""You are BaatKaro, a helpful AI assistant. 
You can chat in both Urdu and English naturally.
Be concise, helpful and friendly."""

async def get_or_create_session(user_id:str,session_id:str=None):
    db=get_db()
    if session_id:
        session=await db.sessions.find_one({"session_id":session_id,"user_id":user_id})
        if session:
            return session_id
    new_session_id=str(uuid.uuid4())
    await db.sessions.insert_one({
        "session_id":new_session_id,
        "user_id":user_id,
        "messages":[],
        "created_at":datetime.utcnow()
    })
    return new_session_id

async def get_chat_history(session_id:str):
    db=get_db()
    session=await db.sessions.find_one({"session_id":session_id})
    if not session:
        return []
    history=[]
    for msg in session.get("messages",[]):
        if msg["role"]=="user":
            history.append(HumanMessage(content=msg["content"]))
        else:
            history.append(AIMessage(content=msg["content"]))
    return history

async def save_message(session_id:str,role:str,content:str):
    db=get_db()
    await db.sessions.update_one(
        {"session_id":session_id},
        {"$push":{"messages":{"role":role,"content":content,"timestamp":datetime.utcnow()}}}
    )

def langchain_to_groq_messages(lc_messages):
    groq_msgs = []
    for msg in lc_messages:
        role = "user"
        if msg.type == "system":
            role = "system"
        elif msg.type == "ai":
            role = "assistant"
        groq_msgs.append({"role": role, "content": msg.content})
    return groq_msgs

async def fallback_stream_groq(messages):
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        stream = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=langchain_to_groq_messages(messages),
            stream=True
        )
        async for chunk in stream:
            content = chunk.choices[0].delta.content or ""
            if content:
                yield content
    except Exception as e:
        print(f"Groq fallback failed: {e}", flush=True)
        yield " [Error: Both Gemini and Groq systems are currently unavailable. Please try again later.]"

async def chat(user_id:str,message:str,session_id:str=None):
    session_id=await get_or_create_session(user_id,session_id)
    history=await get_chat_history(session_id)
    messages=[SystemMessage(content=SYSTEM_PROMPT)]+history+[HumanMessage(content=message)]
    trace=track(user_id=user_id,session_id=session_id,input=message)
    reply = ""
    try:
        response=await llm.ainvoke(messages)
        reply=response.content
    except Exception as e:
        print(f"Gemini invoke failed, falling back to Groq: {e}", flush=True)
        try:
            from groq import AsyncGroq
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            completion = await client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=langchain_to_groq_messages(messages),
            )
            reply = completion.choices[0].message.content
        except Exception as ge:
            print(f"Groq fallback failed: {ge}", flush=True)
            reply = "Both Gemini and Groq systems are currently unavailable. Please try again later."
            
    await save_message(session_id,"user",message)
    await save_message(session_id,"assistant",reply)
    if trace:
        trace.update(output=reply)
    return reply,session_id

async def stream_chat(user_id:str,message:str,session_id:str=None):
    session_id=await get_or_create_session(user_id,session_id)
    history=await get_chat_history(session_id)
    messages=[SystemMessage(content=SYSTEM_PROMPT)]+history+[HumanMessage(content=message)]
    full_reply=""
    try:
        async for chunk in llm.astream(messages):
            if chunk.content:
                full_reply+=chunk.content
                yield chunk.content
    except Exception as e:
        print(f"Gemini streaming failed, falling back to Groq: {e}", flush=True)
        async for content in fallback_stream_groq(messages):
            full_reply+=content
            yield content
    await save_message(session_id,"user",message)
    await save_message(session_id,"assistant",full_reply)

async def get_user_sessions(user_id: str):
    db = get_db()
    sessions = await db.sessions.find(
        {"user_id": user_id},
        {"session_id": 1, "created_at": 1, "messages": {"$slice": 1}}
    ).sort("created_at", -1).to_list(20)
    result = []
    for s in sessions:
        msgs = s.get("messages", [])
        first_msg = msgs[0]["content"][:40] if msgs else "New chat"
        result.append({
            "session_id": s["session_id"],
            "created_at": str(s["created_at"]),
            "last_message": first_msg
        })
    return result

async def delete_session(user_id:str,session_id:str):
    db=get_db()
    await db.sessions.delete_one({"session_id":session_id,"user_id":user_id})