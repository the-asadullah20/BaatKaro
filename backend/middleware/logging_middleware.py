from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
import time
import logging

logging.basicConfig(level=logging.INFO)
logger=logging.getLogger("baatkaro")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self,request:Request,call_next):
        start=time.time()
        response=await call_next(request)
        duration=round((time.time()-start)*1000,2)
        logger.info(f"{request.method} {request.url.path} {response.status_code} {duration}ms")
        return response