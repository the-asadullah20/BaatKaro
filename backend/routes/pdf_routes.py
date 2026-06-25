from fastapi import APIRouter,HTTPException,Depends,UploadFile,File
from services.rag_service import process_pdf,get_user_pdfs,clear_user_store
from auth.auth_handler import get_current_user

router=APIRouter()

@router.post("/upload")
async def upload_pdf(file:UploadFile=File(...),user=Depends(get_current_user)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400,detail="Only PDF files allowed")
    pdf_bytes=await file.read()
    result=await process_pdf(user["id"],pdf_bytes,file.filename)
    return result

@router.get("/list")
async def list_pdfs(user=Depends(get_current_user)):
    return await get_user_pdfs(user["id"])

@router.delete("/clear")
async def clear_pdfs(user=Depends(get_current_user)):
    await clear_user_store(user["id"])
    return {"message":"PDF store cleared"}