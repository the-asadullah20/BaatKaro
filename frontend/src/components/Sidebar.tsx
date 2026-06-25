'use client'
import {useStore} from '@/lib/store'
import {chat} from '@/lib/api'

interface Props{
  onNewChat:()=>void
  onSessionClick:(id:string)=>void
}

export default function Sidebar({onNewChat,onSessionClick}:Props){
  const{sessions,currentSessionId,setCurrentSession,setMessages,user,theme,setTheme}=useStore()

  async function handleDelete(e:React.MouseEvent,id:string){
    e.stopPropagation()
    await chat.deleteSession(id)
    useStore.getState().setSessions(sessions.filter(s=>s.session_id!==id))
    if(currentSessionId===id){setCurrentSession(null);setMessages([])}
  }

  return(
    <div style={{width:'230px',minWidth:'230px',background:'var(--sidebar)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',height:'100%',zIndex:2}}>
      <div style={{padding:'16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'8px'}}>
        <span style={{fontFamily:'Space Grotesk',fontSize:'17px',fontWeight:600,color:'var(--accent)',flex:1}}>
          <i className="ti ti-message-chatbot" aria-hidden="true"/> BaatKaro
        </span>
      </div>

      <button onClick={onNewChat} style={{margin:'10px 12px',padding:'7px 12px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:'7px',fontSize:'12px',fontWeight:500,display:'flex',alignItems:'center',gap:'7px'}}>
        <i className="ti ti-plus" style={{fontSize:'14px'}} aria-hidden="true"/>New chat
      </button>

      <div style={{flex:1,padding:'6px',overflowY:'auto'}}>
        <div style={{fontSize:'10px',color:'var(--text-muted)',padding:'4px 8px 5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Recent</div>
        {sessions.length===0&&(
          <div style={{fontSize:'12px',color:'var(--text-muted)',padding:'12px 8px',textAlign:'center'}}>No chats yet</div>
        )}
        {sessions.map(s=>(
          <div
            key={s.session_id}
            onClick={()=>onSessionClick(s.session_id)}
            style={{padding:'7px 9px',borderRadius:'6px',fontSize:'12px',color:currentSessionId===s.session_id?'var(--accent)':'var(--text-secondary)',background:currentSessionId===s.session_id?'var(--accent-light)':'transparent',display:'flex',alignItems:'center',gap:'7px',cursor:'pointer',overflow:'hidden',position:'relative',marginBottom:'2px'}}
          >
            <i className="ti ti-message" style={{fontSize:'13px',minWidth:'13px',opacity:0.6}} aria-hidden="true"/>
            <span style={{flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontSize:'12px'}}>{s.last_message||'New chat'}</span>
            <button
              onClick={(e)=>handleDelete(e,s.session_id)}
              style={{width:'18px',height:'18px',border:'none',background:'transparent',color:'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'4px'}}
            >
              <i className="ti ti-x" style={{fontSize:'11px'}} aria-hidden="true"/>
            </button>
          </div>
        ))}
      </div>

      <div style={{padding:'8px 6px',borderTop:'1px solid var(--border)'}}>
        {user&&(
          <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 9px',borderRadius:'6px',fontSize:'12px',color:'var(--text-secondary)',marginBottom:'2px'}}>
            <i className="ti ti-user-circle" style={{fontSize:'15px'}} aria-hidden="true"/>
            <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</span>
          </div>
        )}
        <div onClick={()=>setTheme(theme==='light'?'dark':'light')} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 9px',borderRadius:'6px',fontSize:'12px',color:'var(--text-secondary)',cursor:'pointer'}}>
          <i className={`ti ti-${theme==='light'?'moon':'sun'}`} style={{fontSize:'14px'}} aria-hidden="true"/>
          {theme==='light'?'Dark mode':'Light mode'}
        </div>
        <div onClick={()=>{useStore.getState().logout();window.location.href='/auth'}} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 9px',borderRadius:'6px',fontSize:'12px',color:'var(--text-secondary)',cursor:'pointer'}}>
          <i className="ti ti-logout" style={{fontSize:'14px'}} aria-hidden="true"/>Log out
        </div>
      </div>
    </div>
  )
}