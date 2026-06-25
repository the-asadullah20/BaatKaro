from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_db, close_db
from routes.auth_routes import router as auth_router
from routes.chat_routes import router as chat_router
from routes.media_routes import router as media_router
from routes.pdf_routes import router as pdf_router
from middleware.guardrails import GuardrailsMiddleware
from middleware.logging_middleware import LoggingMiddleware
from services.langfuse_service import init_langfuse


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    init_langfuse()
    yield
    await close_db()


app = FastAPI(title="BaatKaro API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
app.add_middleware(GuardrailsMiddleware)
app.add_middleware(LoggingMiddleware)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(media_router, prefix="/api/media", tags=["media"])
app.include_router(pdf_router, prefix="/api/pdf", tags=["pdf"])


@app.get("/")
async def root():
    return {"status": "ok", "message": "BaatKaro API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
