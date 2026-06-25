# BaatKaro AI

## Run Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in .env values
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

## Deploy to Google Cloud Run

### Backend
```bash
cd backend
gcloud run deploy baatkaro-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars GEMINI_API_KEY=xxx,GROQ_API_KEY=xxx,MONGODB_URI=xxx,JWT_SECRET=xxx,DB_NAME=baatkaro
```

### Frontend
```bash
cd frontend
gcloud run deploy baatkaro-frontend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars NEXT_PUBLIC_API_URL=https://baatkaro-backend-xxx.run.app
```
