from passlib.context import CryptContext
from jose import JWTError,jwt
from datetime import datetime,timedelta
from app.database import get_db
from core.config import settings
from bson import ObjectId
from auth.face_auth import find_matching_user

pwd_context=CryptContext(schemes=["bcrypt"],deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password[:72])

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:72], hashed)

def create_token(data:dict)->str:
    expire=datetime.utcnow()+timedelta(hours=settings.JWT_EXPIRE_HOURS)
    data.update({"exp":expire})
    return jwt.encode(data,settings.JWT_SECRET,algorithm="HS256")

def decode_token(token:str)->dict:
    try:
        return jwt.decode(token,settings.JWT_SECRET,algorithms=["HS256"])
    except JWTError:
        return None

async def register_user(name:str,email:str,password:str,face_encoding:list=None):
    db=get_db()
    existing=await db.users.find_one({"email":email})
    if existing:
        return None,"Email already registered"
    user={
        "name":name,
        "email":email,
        "password":hash_password(password),
        "face_encoding":face_encoding,
        "created_at":datetime.utcnow()
    }
    result=await db.users.insert_one(user)
    token=create_token({"sub":str(result.inserted_id),"email":email})
    return token,None

async def login_user(email:str,password:str):
    db=get_db()
    user=await db.users.find_one({"email":email})
    if not user:
        return None,"User not found"
    if not verify_password(password,user["password"]):
        return None,"Invalid password"
    token=create_token({"sub":str(user["_id"]),"email":email})
    return token,None

async def face_login(face_encoding:list):
    db=get_db()
    users=await db.users.find({"face_encoding":{"$exists":True,"$ne":None}}).to_list(None)
    match=find_matching_user(users,face_encoding)
    if not match:
        return None,"Face not recognized"
    token=create_token({"sub":str(match["_id"]),"email":match["email"]})
    return token,None

async def get_user_by_id(user_id:str):
    db=get_db()
    user=await db.users.find_one({"_id":ObjectId(user_id)})
    if not user:
        return None
    return {"id":str(user["_id"]),"name":user["name"],"email":user["email"]}