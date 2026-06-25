from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import HumanMessage, SystemMessage
from langchain_community.document_loaders import PyPDFLoader
from app.database import get_db
from core.config import settings
from datetime import datetime
from services.langfuse_service import track_rag
import tempfile
import asyncio
import os

embeddings = GoogleGenerativeAIEmbeddings(
    model=settings.GEMINI_EMBEDDING_MODEL,
    google_api_key=settings.GEMINI_API_KEY
)

llm = ChatGoogleGenerativeAI(
    model=settings.LLM_MODEL,
    google_api_key=settings.GEMINI_API_KEY,
    streaming=True
)

splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150,
    separators=["\n\n", "\n", ".", " ", ""]
)

user_stores: dict = {}

RAG_SYSTEM = """You are BaatKaro, a helpful AI assistant.
Answer questions based on the provided document context.
If the answer is not in the context, say so clearly.
You can respond in Urdu or English based on the user's language."""


def _build_index_sync(user_id: str, pdf_bytes: bytes, filename: str):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as f:
        f.write(pdf_bytes)
        tmp_path = f.name
    try:
        loader = PyPDFLoader(tmp_path)
        pages = loader.load()
        chunks = splitter.split_documents(pages)
        if user_id in user_stores:
            user_stores[user_id].add_documents(chunks)
        else:
            user_stores[user_id] = FAISS.from_documents(chunks, embeddings)
        return len(pages), len(chunks)
    finally:
        os.unlink(tmp_path)


async def process_pdf(user_id: str, pdf_bytes: bytes, filename: str):
    db = get_db()
    loop = asyncio.get_event_loop()
    pages, chunks = await loop.run_in_executor(
        None, _build_index_sync, user_id, pdf_bytes, filename
    )
    await db.pdfs.insert_one({
        "user_id": user_id,
        "filename": filename,
        "pages": pages,
        "chunks": chunks,
        "uploaded_at": datetime.utcnow()
    })
    return {"filename": filename, "pages": pages, "chunks": chunks}


async def rag_chat(user_id: str, message: str, session_id: str = None):
    from services.chat_service import get_or_create_session, get_chat_history, save_message
    if user_id not in user_stores:
        async for chunk in rag_stream_fallback(user_id, message, session_id):
            yield chunk
        return
    session_id = await get_or_create_session(user_id, session_id)
    history = await get_chat_history(session_id)
    docs = user_stores[user_id].similarity_search(message, k=5)
    context = "\n\n".join([d.page_content for d in docs])
    system = f"{RAG_SYSTEM}\n\nDocument Context:\n{context}"
    messages = [SystemMessage(content=system)] + history + [HumanMessage(content=message)]
    track_rag(user_id=user_id, session_id=session_id, input=message, chunks=len(docs))
    full_reply = ""
    async for chunk in llm.astream(messages):
        if chunk.content:
            full_reply += chunk.content
            yield chunk.content
    await save_message(session_id, "user", message)
    await save_message(session_id, "assistant", full_reply)


async def rag_stream_fallback(user_id: str, message: str, session_id: str):
    from services.chat_service import stream_chat
    async for chunk in stream_chat(user_id, message, session_id):
        yield chunk


async def get_user_pdfs(user_id: str):
    db = get_db()
    pdfs = await db.pdfs.find({"user_id": user_id}).sort("uploaded_at", -1).to_list(50)
    return [{"filename": p["filename"], "pages": p["pages"], "uploaded_at": str(p["uploaded_at"])} for p in pdfs]


async def clear_user_store(user_id: str):
    if user_id in user_stores:
        del user_stores[user_id]
