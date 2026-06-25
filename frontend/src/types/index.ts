export interface User{
  id:string
  name:string
  email:string
}

export interface Message{
  role:'user'|'assistant'
  content:string
  timestamp:string
}

export interface Session{
  session_id:string
  created_at:string
  last_message:string
}

export interface PDF{
  filename:string
  pages:number
  uploaded_at:string
}