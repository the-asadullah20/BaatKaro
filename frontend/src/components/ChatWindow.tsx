'use client'
import {useEffect,useRef} from 'react'
import {Message} from '@/types'


interface Props{messages:Message[];isStreaming:boolean}

export default function ChatWindow({messages,isStreaming}:Props){
  const bottomRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:'smooth'})
  },[messages])

  if(messages.length===0){
    return(
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',opacity:0.5}}>
        <i className="ti ti-message-chatbot" style={{fontSize:'40px',color:'var(--accent)'}} aria-hidden="true"/>
        <p style={{fontSize:'14px',color:'var(--text-secondary)'}}>Start a conversation</p>
      </div>
    )
  }

  return(
    <div style={{flex:1,overflowY:'auto',padding:'18px 14px',display:'flex',flexDirection:'column',gap:'12px',minHeight:0}}>
      {messages.map((msg,i)=>(
        <div key={i} style={{display:'flex',gap:'8px',alignSelf:msg.role==='user'?'flex-end':'flex-start',flexDirection:msg.role==='user'?'row-reverse':'row',maxWidth:'78%'}}>
          <div style={{width:'24px',height:'24px',borderRadius:'50%',background:msg.role==='user'?'var(--border)':'var(--accent)',color:msg.role==='user'?'var(--text-secondary)':'#fff',display:'flex',alignItems:'center',justifyContent:'center',minWidth:'24px',marginTop:'2px'}}>
            <i className={`ti ti-${msg.role==='user'?'user':'message-chatbot'}`} style={{fontSize:'11px'}} aria-hidden="true"/>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:msg.role==='user'?'flex-end':'flex-start'}}>
            <div style={{padding:'8px 12px',borderRadius:'12px',borderBottomLeftRadius:msg.role==='assistant'?'3px':'12px',borderBottomRightRadius:msg.role==='user'?'3px':'12px',fontSize:'13px',lineHeight:1.55,background:msg.role==='user'?'var(--accent)':'var(--ai-msg)',color:msg.role==='user'?'#fff':'var(--text-primary)',border:msg.role==='assistant'?'1px solid var(--border)':'none',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
              {msg.role==='assistant'?msg.content.replace(/\*/g,''):msg.content}
              {isStreaming&&i===messages.length-1&&msg.role==='assistant'&&msg.content===''&&(
                <div style={{display:'flex',gap:'4px',padding:'2px 0'}}>
                  {[0,1,2].map(j=>(
                    <span key={j} style={{width:'5px',height:'5px',background:'var(--text-muted)',borderRadius:'50%',display:'inline-block',animation:`typing 1.2s infinite ${j*0.2}s`}}/>
                  ))}
                </div>
              )}
            </div>
            <span style={{fontSize:'10px',color:'var(--text-muted)',marginTop:'2px',padding:'0 2px'}}>{msg.timestamp}</span>
          </div>
        </div>
      ))}
      <div ref={bottomRef}/>
      <style>{`@keyframes typing{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}