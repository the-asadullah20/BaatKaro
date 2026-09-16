# BaatKaro — Technical Report & System Architecture

*A Secure Multimodal AI Assistant with Facial Authentication and Document Intelligence*

## Abstract

BaatKaro is a production-grade, containerized AI assistant that merges real-time LLM interaction (via Gemini 2.5 Flash and a transparent Groq Llama 3.1 fallback), Retrieval-Augmented Generation (RAG) for PDF query analysis, speech-to-text transcription, and a biometric Face ID authentication mechanism. Built using a Next.js frontend and a FastAPI backend, the system is fully automated with a GitHub Actions CI/CD pipeline and deployed on Google Cloud Run with deep monitoring instrumented through Langfuse and Logfire.

## Contents

1. [Introduction & Project Overview](#1-introduction--project-overview)
2. [System Workflow & Architecture](#2-system-workflow--architecture)
3. [Authentication System](#3-authentication-system)
4. [Core APIs & Services](#4-core-apis--services)
5. [Database Schema](#5-database-schema)
6. [Deployment & CI/CD Pipeline](#6-deployment--cicd-pipeline)

## 1. Introduction & Project Overview

BaatKaro is a next-generation web application designed to serve as a secure, cross-lingual AI assistant. It integrates three core pillars of modern web intelligence:

1. **Multimodal Interaction:** Natural language chatting in English and Roman Urdu, integrated with Whisper-based voice recognition and speech-to-text.
2. **Facial Authentication (Face ID):** Client-side image canvas scanning which produces a 128-dimensional vector matched on the backend using optimized Euclidean distance calculations.
3. **Document Intelligence (RAG):** Local FAISS vector storage combined with Google Generative AI embeddings to parse and query large PDF documents.

## 2. System Workflow & Architecture

The system adopts a decoupled, microservices-oriented architecture. The client browser communicates with the Next.js API router, which proxies request endpoints directly to the live FastAPI gateway.

### 2.1 Step-by-Step Request Flow

1. **Authentication Phase:** The user logs in via credentials (Email/Password) or biometric Face ID. On success, a signed JWT token is returned and stored in the client's local storage.
2. **Session Initialization:** Upon starting a chat, the Next.js client requests session details. The backend creates a new UUID session document in MongoDB if one does not exist.
3. **Chat Execution:** The user sends a text or voice prompt. If voice, the audio is transcribed via Groq Whisper. The message is checked against the RAG context (if a PDF is active) and streamed back via server-sent events (SSE).
4. **LLM Fallback Cycle:** The backend initiates a stream call using Gemini. If a rate limit (429 ResourceExhausted) occurs, the stream catches the exception and transparently hooks into the Groq Llama 3.1 client to continue streaming to the client without error.

## 3. Authentication System

BaatKaro implements a hybrid authentication framework combining standard cryptographic password hashing and client-side biometric facial matching.

### 3.1 JSON Web Token (JWT)

On successful authentication, the backend generates an HS256-signed JWT token containing the user's object ID (`sub`) and expiration date. Subsequent API calls contain the `Authorization: Bearer <token>` header.

### 3.2 Biometric Face ID Algorithm

1. **Capture Phase:** The user grants camera access. Clicking "Capture Photo" halts the stream and draws the video frame on a low-resolution 6 × 7 grid on a hidden HTML5 canvas.
2. **Vector Normalization:** The browser reads the raw pixel color channels (RGB) from the canvas, normalizes the values to the `[0, 1]` interval, and appends two zeros to build a 128-dimensional vector:

   ```
   q = [q1, q2, ..., q126, 0, 0]ᵀ
   ```

3. **Distance Matching:** During registration, `q` is saved as `face_encoding`. During login, the query vector `q` is compared against all registered user encodings `sᵢ` in the database using the Euclidean distance:

   ```
   dᵢ = ‖sᵢ − q‖₂ = sqrt( Σⱼ₌₁¹²⁸ (sᵢ,ⱼ − qⱼ)² )
   ```

   A match is approved for the minimum distance satisfying the relaxed threshold criteria:

   ```
   dᵢ < 1.8
   ```

## 4. Core APIs & Services

| Provider | Model/Engine | Purpose |
|---|---|---|
| Google AI Studio | Gemini 2.5 Flash | Primary Conversational Model |
| Groq Cloud | Llama 3.1 8B Instant | High-Speed Fallback Chat Model |
| Groq Cloud | Whisper-large-v3 | Audio Speech-to-Text Transcription |
| Google Cloud | Text-to-Speech / gTTS | Text-to-Audio Output Conversion |
| Google Embeddings | gemini-embedding-2 | RAG Vector Space Generation |

### 4.1 Retrieval-Augmented Generation (RAG) Cache

When a user uploads a PDF, the document is chunked dynamically using the `RecursiveCharacterTextSplitter` (chunk size: 800, overlap: 150) and vectorized using Google embeddings. The vector index is cached in memory under `user_stores` using a local FAISS store linked to the active `user_id`, minimizing MongoDB query traffic during context retrieval.

## 5. Database Schema

MongoDB holds the persistence layer with three main collections:

- **Users:** Holds profile records containing username, hashed bcrypt password, and the normalized 128-float `face_encoding` array.
- **Sessions:** Stores chat records mapped to a unique `session_id` and `user_id`, containing a sequential array of messages and timestamps.
- **PDFs:** Stores uploaded document metadata (filenames, page lengths, upload dates).

## 6. Deployment & CI/CD Pipeline

### 6.1 Dockerization

The backend runs on Python 3.11-slim, optimized using mirror registries. The frontend runs Next.js in `standalone` output mode, which bakes dependencies and static assets into a lightweight distribution.

### 6.2 GitHub Actions CI/CD Workflow

The automated pipeline configures the following workflow on pushing to the `main` branch:

```yaml
# Backend Deployment Step
gcloud run deploy baatkaro-backend \
  --image gcr.io/baatkaro-app-99/baatkaro-backend:latest \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }},GROQ_API_KEY=${{ secrets.GROQ_API_KEY }},MONGODB_URI=${{ secrets.MONGODB_URI }},LANGFUSE_PUBLIC_KEY=${{ secrets.LANGFUSE_PUBLIC_KEY }},LANGFUSE_SECRET_KEY=${{ secrets.LANGFUSE_SECRET_KEY }},LOGFIRE_TOKEN=${{ secrets.LOGFIRE_TOKEN }}
```

The frontend is compiled on the runner host before the container is built to bypass container MTU network drops. The resulting image is pushed to GCR and deployed to Cloud Run, establishing complete end-to-end automation.
