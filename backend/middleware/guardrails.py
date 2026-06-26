from fastapi.responses import JSONResponse

BLOCKED_PATTERNS = [
    "how to make bomb", "how to make weapon", "kill yourself",
    "self harm", "drug synthesis", "hack into"
]

SKIP_PATHS = [
    "/api/media/stt", "/api/pdf/upload", "/health", "/",
    "/api/auth/register", "/api/auth/login", "/api/auth/face-login", "/api/auth/me"
]

class GuardrailsMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope.get("method")
        path = scope.get("path", "")
        
        if method == "POST" and path not in SKIP_PATHS:
            try:
                chunks = []
                more_body = True
                while more_body:
                    message = await receive()
                    if message["type"] == "http.disconnect":
                        await self.app(scope, receive, send)
                        return
                    chunks.append(message.get("body", b""))
                    more_body = message.get("more_body", False)
                
                body = b"".join(chunks)
                text = body.decode("utf-8", errors="ignore").lower()
                
                violates = False
                for pattern in BLOCKED_PATTERNS:
                    if pattern in text:
                        violates = True
                        break
                        
                if violates:
                    response = JSONResponse(
                        status_code=400,
                        content={"detail": "Message violates content policy"}
                    )
                    await response(scope, receive, send)
                    return
                
                body_sent = False
                async def receive_with_cached_body():
                    nonlocal body_sent
                    if not body_sent:
                        body_sent = True
                        return {"type": "http.request", "body": body, "more_body": False}
                    else:
                        return await receive()
                        
                await self.app(scope, receive_with_cached_body, send)
            except Exception:
                await self.app(scope, receive, send)
        else:
            await self.app(scope, receive, send)