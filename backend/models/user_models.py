from pydantic import BaseModel,EmailStr
from typing import Optional,List

class UserRegister(BaseModel):
    name:str
    email:EmailStr
    password:str
    face_encoding:Optional[List[float]]=None

class UserLogin(BaseModel):
    email:EmailStr
    password:str

class FaceLogin(BaseModel):
    face_encoding:List[float]
    
class UserResponse(BaseModel):
    id:str
    name:str
    email:str

    
