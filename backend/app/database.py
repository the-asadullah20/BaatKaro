from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings

client=None
db=None

async def connect_db():
    global client,db
    client=AsyncIOMotorClient(settings.MONGODB_URI)
    db=client[settings.DB_NAME]
    print("Connected")
    
async def close_db():
    global client
    if client:
        client.close()
    print("Closed")
    
def get_db():
    return db
