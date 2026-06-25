from pydantic import BaseModel
from typing import Optional,List

class ChatMessage(BaseModel):
    message:str
    session_id:Optional[str]=None

class ChatResponse(BaseModel):
    response:str
    session_id:str

class ChatHistory(BaseModel):
    session_id:str
    messages:List[dict]