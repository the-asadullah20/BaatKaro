from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse

BLOCKED_PATTERNS = [
    "how to make bomb", "how to make weapon", "kill yourself",
    "self harm", "drug synthesis", "hack into"
]

SKIP_PATHS = ["/api/media/stt", "/api/pdf/upload", "/health", "/"]

class GuardrailsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" and request.url.path not in SKIP_PATHS:
            try:
                body = await request.body()
                text = body.decode("utf-8", errors="ignore").lower()
                for pattern in BLOCKED_PATTERNS:
                    if pattern in text:
                        return JSONResponse(
                            status_code=400,
                            content={"detail": "Message violates content policy"}
                        )
            except Exception:
                pass
        response = await call_next(request)
        return response