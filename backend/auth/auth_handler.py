from fastapi import Depends,HTTPException
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from services.auth_service import decode_token,get_user_by_id

bearer=HTTPBearer()

async def get_current_user(credentials:HTTPAuthorizationCredentials=Depends(bearer)):
    token=credentials.credentials
    payload=decode_token(token)
    if not payload:
        raise HTTPException(status_code=401,detail="Invalid or expired token")
    user=await get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=401,detail="User not found")
    return user