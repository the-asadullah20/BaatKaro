'use client'
import {useEffect,useRef,useState,useCallback} from 'react'
import {useRouter} from 'next/navigation'
import {useStore} from '@/lib/store'
import {auth,chat,pdf} from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import ChatWindow from '@/components/ChatWindow'
import AudioRecorder from '@/components/AudioRecorder'
import PdfUpload from '@/components/PdfUpload'

export default function ChatPage(){
  const router=useRouter()
  const{setUser,token,currentSessionId,setCurrentSession,addMessage,appendToLastMessage,setIsStreaming,isStreaming,haspdfs,setHasPdfs,messages,setMessages,setSessions,lastReply}=useStore()
  const[input,setInput]=useState('')
  const[showPdfModal,setShowPdfModal]=useState(false)
  const[error,setError]=useState('')
  const[sidebarOpen,setSidebarOpen]=useState(false)
  const inputRef=useRef<HTMLTextAreaElement>(null)

  const loadSessions = useCallback(async ()=>{
    try{
      const s=await chat.getSessions()
      setSessions(s)
    }catch{}
  },[setSessions])

  useEffect(()=>{
    if(!token){router.push('/auth');return}
    auth.me().then(setUser).catch(()=>router.push('/auth'))
    loadSessions()
    const bubbles=[{s:130,t:'6%',l:'35%',d:7},{s:70,t:'18%',l:'72%',d:9},{s:100,t:'48%',l:'55%',d:11},{s:50,t:'62%',l:'84%',d:8},{s:155,t:'68%',l:'28%',d:13}];
    const bc=document.getElementById('chatBubbles');
    if(bc && bc.childNodes.length===0){
      bubbles.forEach((b,i)=>{
        const el=document.createElement('div');
        el.className='bubble-item';
        el.style.cssText='width:'+b.s+'px;height:'+b.s+'px;top:'+b.t+';left:'+b.l+';animation-duration:'+b.d+'s;animation-delay:-'+(i*1.5)+'s';
        bc.appendChild(el);
      });
    }
  },[token,router,setUser,loadSessions])

  async function handleSessionClick(sessionId:string){
    setSidebarOpen(false)
    setMessages([])
    setCurrentSession(sessionId)
    try{
      const msgs=await chat.getSessionMessages(sessionId)
      setMessages(msgs)
    }catch{}
  }

  async function handleSend(text?:string){
    const msg=text||input.trim()
    if(!msg||isStreaming)return
    setInput('')
    setError('')
    const ts=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    addMessage({role:'user',content:msg,timestamp:ts})
    addMessage({role:'assistant',content:'',timestamp:ts})
    setIsStreaming(true)
    try{
      const streamFn=haspdfs?chat.ragStream:chat.stream
      const newSessionId=await streamFn(msg,currentSessionId,(chunk)=>{
        appendToLastMessage(chunk)
      })
      if(newSessionId && newSessionId!==currentSessionId){
        setCurrentSession(newSessionId)
      }
      await loadSessions()
    }catch{
      appendToLastMessage('Something went wrong. Please try again.')
    }finally{
      setIsStreaming(false)
    }
  }

  async function handleNewChat(){
    setSidebarOpen(false)
    setCurrentSession(null)
    setMessages([])
    setError('')
  }

  function handleKeyDown(e:React.KeyboardEvent){
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}
  }

  return(
    <div style={{display:'flex',height:'100vh',background:'var(--bg)',overflow:'hidden',position:'relative'}}>
      <div className="bubble-bg" id="chatBubbles"/>
      <div className={`responsive-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar onNewChat={handleNewChat} onSessionClick={handleSessionClick}/>
      </div>
      {sidebarOpen && (
        <div className="responsive-sidebar-overlay" onClick={()=>setSidebarOpen(false)}/>
      )}

      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,zIndex:1}}>
        <div style={{height:'48px',minHeight:'48px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 16px',background:'rgba(250,248,245,0.96)',gap:'10px',backdropFilter:'blur(8px)'}}>
          <button 
            className="mobile-menu-btn"
            onClick={()=>setSidebarOpen(true)}
            style={{
              width:'30px',
              height:'30px',
              borderRadius:'6px',
              border:'none',
              background:'transparent',
              color:'var(--text-secondary)',
              alignItems:'center',
              justifyContent:'center'
            }}
          >
            <i className="ti ti-menu-2" style={{fontSize:'18px'}} aria-hidden="true"/>
          </button>
          <span style={{fontFamily:'Space Grotesk',fontSize:'14px',fontWeight:500,flex:1,color:'var(--text-primary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {currentSessionId?'Chat session':'New chat'}
          </span>
          {haspdfs&&<span style={{fontSize:'11px',background:'var(--accent-light)',color:'var(--accent)',padding:'2px 8px',borderRadius:'9px',border:'1px solid rgba(201,122,82,0.2)'}}>PDF mode</span>}
          {haspdfs&&(
            <button onClick={async()=>{await pdf.clear();setHasPdfs(false)}} title="Clear PDFs" style={{width:'30px',height:'30px',borderRadius:'6px',border:'none',background:'transparent',color:'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className="ti ti-trash" style={{fontSize:'15px'}} aria-hidden="true"/>
            </button>
          )}
          <button onClick={()=>setShowPdfModal(true)} style={{width:'30px',height:'30px',borderRadius:'6px',border:'none',background:'transparent',color:'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className="ti ti-file-upload" style={{fontSize:'17px'}} aria-hidden="true"/>
          </button>
        </div>

        <ChatWindow messages={messages} isStreaming={isStreaming}/>

        {error&&(
          <div style={{margin:'0 14px 8px',padding:'8px 12px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:'8px',fontSize:'12px',color:'#DC2626'}}>
            {error}
          </div>
        )}

        <div style={{padding:'10px 14px 14px',background:'rgba(250,248,245,0.97)',borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'flex-end',gap:'6px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'10px',padding:'6px 6px 6px 12px'}}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'}}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              style={{flex:1,border:'none',outline:'none',resize:'none',fontSize:'13px',fontFamily:'Inter',background:'transparent',color:'var(--text-primary)',lineHeight:'1.5',minHeight:'20px',maxHeight:'120px'}}
            />
            <div style={{display:'flex',gap:'4px'}}>
              <AudioRecorder onTranscript={handleSend} lastReply={lastReply}/>
              <button onClick={()=>setShowPdfModal(true)} style={{width:'28px',height:'28px',borderRadius:'6px',border:'none',background:'transparent',color:'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <i className="ti ti-paperclip" style={{fontSize:'15px'}} aria-hidden="true"/>
              </button>
              <button onClick={()=>handleSend()} disabled={isStreaming||!input.trim()} style={{width:'28px',height:'28px',borderRadius:'6px',border:'none',background:input.trim()?'var(--accent)':'var(--border)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
                <i className="ti ti-send" style={{fontSize:'14px'}} aria-hidden="true"/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPdfModal&&<PdfUpload onClose={()=>setShowPdfModal(false)} onUploaded={()=>{setHasPdfs(true);setShowPdfModal(false)}}/>}

    </div>
  )
}