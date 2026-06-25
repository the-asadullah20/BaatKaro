import {create} from 'zustand'
import {User,Message,Session,PDF} from '@/types'

function getTokenSafe():string|null{
  if(typeof window==='undefined')return null
  return localStorage.getItem('token')
}

interface AppStore{
  user:User|null
  token:string|null
  theme:'light'|'dark'
  sessions:Session[]
  currentSessionId:string|null
  messages:Message[]
  pdfs:PDF[]
  isStreaming:boolean
  haspdfs:boolean
  lastReply:string
  
  setUser:(user:User|null)=>void
  setToken:(token:string|null)=>void
  setTheme:(theme:'light'|'dark')=>void
  setSessions:(sessions:Session[])=>void
  setCurrentSession:(id:string|null)=>void
  addMessage:(msg:Message)=>void
  setMessages:(msgs:Message[])=>void
  appendToLastMessage:(chunk:string)=>void
  setPdfs:(pdfs:PDF[])=>void
  setIsStreaming:(v:boolean)=>void
  setHasPdfs:(v:boolean)=>void
  setLastReply:(v:string)=>void
  logout:()=>void
}

export const useStore=create<AppStore>((set)=>({
  user:null,
  token:getTokenSafe(),
  theme:'light',
  sessions:[],
  currentSessionId:null,
  messages:[],
  pdfs:[],
  isStreaming:false,
  haspdfs:false,
  lastReply:'',
  setUser:(user)=>set({user}),
  setToken:(token)=>{
    set({token})
    if(typeof window!=='undefined'){
      if(token)localStorage.setItem('token',token)
      else localStorage.removeItem('token')
    }
  },
  setTheme:(theme)=>{
    set({theme})
    if(typeof window!=='undefined'){
      document.documentElement.classList.toggle('dark',theme==='dark')
    }
  },
  setSessions:(sessions)=>set({sessions}),
  setCurrentSession:(id)=>set({currentSessionId:id,messages:[]}),
  addMessage:(msg)=>set((s)=>({messages:[...s.messages,msg]})),
  setMessages:(msgs)=>set({messages:msgs}),
  appendToLastMessage:(chunk)=>set((s)=>{
    const msgs=[...s.messages]
    if(msgs.length===0)return{}
    const last=msgs[msgs.length-1]
    if(last.role==='assistant'){
      msgs[msgs.length-1]={...last,content:last.content+chunk}
      return{messages:msgs,lastReply:last.content+chunk}
    }
    return{messages:msgs}
  }),
  setPdfs:(pdfs)=>set({pdfs}),
  setIsStreaming:(isStreaming)=>set({isStreaming}),
  setHasPdfs:(haspdfs)=>set({haspdfs}),
  setLastReply:(lastReply)=>set({lastReply}),
  logout:()=>{
    set({user:null,token:null,sessions:[],messages:[],currentSessionId:null,pdfs:[],lastReply:''})
    if(typeof window!=='undefined')localStorage.removeItem('token')
  }
}))
