const BASE_URL=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000'

function getToken(){
  return localStorage.getItem('token')
}

getSessionMessages: async(session_id: string)=>{
  const res = await request(`/api/chat/sessions/${session_id}/messages`)
  return res.json()
}

async function request(path:string,options:RequestInit={}){
  const token=getToken()
  const res=await fetch(`${BASE_URL}${path}`,{
    ...options,
    headers:{
      'Content-Type':'application/json',
      ...(token?{Authorization:`Bearer ${token}`}:{}),
      ...options.headers,
    }
  })
  if(!res.ok){
    const err=await res.json().catch(()=>({}))
    throw new Error(err.detail||'Request failed')
  }
  return res
}

export const auth={
  register:async(name:string,email:string,password:string,face_encoding:number[]|null=null)=>{
    const res=await request('/api/auth/register',{method:'POST',body:JSON.stringify({name,email,password,face_encoding})})
    return res.json()
  },
  login:async(email:string,password:string)=>{
    const res=await request('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})})
    return res.json()
  },
  faceLogin:async(face_encoding:number[])=>{
    const res=await request('/api/auth/face-login',{method:'POST',body:JSON.stringify({face_encoding})})
    return res.json()
  },
  me:async()=>{
    const res=await request('/api/auth/me')
    return res.json()
  }
}

export const chat={
  stream:async(message:string,session_id:string|null,onChunk:(chunk:string)=>void)=>{
    const token=getToken()
    const res=await fetch(`${BASE_URL}/api/chat/stream`,{
      method:'POST',
      headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
      body:JSON.stringify({message,session_id})
    })
    if(!res.ok)throw new Error('Stream failed')
    const reader=res.body!.getReader()
    const decoder=new TextDecoder()
    while(true){
      const{done,value}=await reader.read()
      if(done)break
      onChunk(decoder.decode(value))
    }
  },
  ragStream:async(message:string,session_id:string|null,onChunk:(chunk:string)=>void)=>{
    const token=getToken()
    const res=await fetch(`${BASE_URL}/api/chat/rag-stream`,{
      method:'POST',
      headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
      body:JSON.stringify({message,session_id})
    })
    if(!res.ok)throw new Error('RAG stream failed')
    const reader=res.body!.getReader()
    const decoder=new TextDecoder()
    while(true){
      const{done,value}=await reader.read()
      if(done)break
      onChunk(decoder.decode(value))
    }
  },
  getSessions:async()=>{
    const res=await request('/api/chat/sessions')
    return res.json()
  },
  deleteSession:async(session_id:string)=>{
    await request(`/api/chat/sessions/${session_id}`,{method:'DELETE'})
  }
}

export const media={
  stt:async(audioBlob:Blob)=>{
    const token=getToken()
    const form=new FormData()
    form.append('audio',audioBlob,'audio.webm')
    const res=await fetch(`${BASE_URL}/api/media/stt`,{
      method:'POST',
      headers:{...(token?{Authorization:`Bearer ${token}`}:{})},
      body:form
    })
    if(!res.ok)throw new Error('STT failed')
    return res.json()
  },
  tts:async(text:string)=>{
    const token=getToken()
    const res=await fetch(`${BASE_URL}/api/media/tts`,{
      method:'POST',
      headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
      body:JSON.stringify({text})
    })
    if(!res.ok)throw new Error('TTS failed')
    return res.blob()
  }
}

export const pdf={
  upload:async(file:File)=>{
    const token=getToken()
    const form=new FormData()
    form.append('file',file)
    const res=await fetch(`${BASE_URL}/api/pdf/upload`,{
      method:'POST',
      headers:{...(token?{Authorization:`Bearer ${token}`}:{})},
      body:form
    })
    if(!res.ok)throw new Error('PDF upload failed')
    return res.json()
  },
  list:async()=>{
    const res=await request('/api/pdf/list')
    return res.json()
  },
  clear:async()=>{
    await request('/api/pdf/clear',{method:'DELETE'})
  }
}