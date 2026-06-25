from fastapi import APIRouter,HTTPException,Depends
from models.user_models import UserRegister,UserLogin,FaceLogin
from services.auth_service import register_user,login_user,face_login,get_user_by_id
from auth.auth_handler import get_current_user

router=APIRouter()

@router.post("/register")
async def register(data:UserRegister):
    token,error=await register_user(data.name,data.email,data.password,data.face_encoding)
    if error:
        raise HTTPException(status_code=400,detail=error)
    return {"token":token,"message":"Registered successfully"}

@router.post("/login")
async def login(data:UserLogin):
    token,error=await login_user(data.email,data.password)
    if error:
        raise HTTPException(status_code=401,detail=error)
    return {"token":token,"message":"Login successful"}

@router.post("/face-login")
async def face_login_route(data:FaceLogin):
    token,error=await face_login(data.face_encoding)
    if error:
        raise HTTPException(status_code=401,detail=error)
    return {"token":token,"message":"Face login successful"}

@router.get("/me")
async def me(user=Depends(get_current_user)):
    return user