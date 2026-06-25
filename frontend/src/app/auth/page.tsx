'use client'
import {useState,useRef,useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {auth} from '@/lib/api'
import {useStore} from '@/lib/store'

type Mode='login'|'register'|'face'

export default function AuthPage(){
  const router=useRouter()
  const{setUser,setToken}=useStore()
  const[mode,setMode]=useState<Mode>('login')
  const[name,setName]=useState('')
  const[email,setEmail]=useState('')
  const[password,setPassword]=useState('')
  const[error,setError]=useState('')
  const[loading,setLoading]=useState(false)
  const videoRef=useRef<HTMLVideoElement>(null)
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const streamRef=useRef<MediaStream|null>(null)

  useEffect(()=>{
    if(typeof window!=='undefined'){
      const token=localStorage.getItem('token')
      if(token)router.push('/chat')
    }
    const bubbles=[{s:140,t:'8%',l:'10%',d:7},{s:80,t:'20%',l:'70%',d:9},{s:110,t:'60%',l:'55%',d:11},{s:60,t:'72%',l:'82%',d:8},{s:170,t:'75%',l:'5%',d:13}];
    const bc=document.getElementById('authBubbles');
    if(bc && bc.childNodes.length===0){
      bubbles.forEach((b,i)=>{
        const el=document.createElement('div');
        el.className='bubble-item';
        el.style.cssText='width:'+b.s+'px;height:'+b.s+'px;top:'+b.t+';left:'+b.l+';animation-duration:'+b.d+'s;animation-delay:-'+(i*1.5)+'s';
        bc.appendChild(el);
      });
    }
  },[])

  useEffect(()=>{
    if(mode==='face'||mode==='register')startCamera()
    else stopCamera()
    return()=>{stopCamera()}
  },[mode])

  async function startCamera(){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:true})
      streamRef.current=stream
      if(videoRef.current)videoRef.current.srcObject=stream
    }catch{setError('Camera access denied')}
  }

  function stopCamera(){
    streamRef.current?.getTracks().forEach(t=>t.stop())
    streamRef.current=null
  }

  function captureEncoding():number[]{
    const canvas=canvasRef.current!
    const video=videoRef.current!
    const ctx=canvas.getContext('2d')!
    canvas.width=6
    canvas.height=7
    ctx.drawImage(video,0,0,6,7)
    const data=ctx.getImageData(0,0,6,7).data
    const encoding:number[]=[]
    for(let i=0;i<data.length;i+=4){
      encoding.push(data[i]/255)
      encoding.push(data[i+1]/255)
      encoding.push(data[i+2]/255)
    }
    encoding.push(0)
    encoding.push(0)
    return encoding
  }

  async function handleSubmit(){
    setError('');setLoading(true)
    try{
      let res
      if(mode==='login'){
        res=await auth.login(email,password)
      }else if(mode==='register'){
        const encoding=captureEncoding()
        res=await auth.register(name,email,password,encoding)
      }else{
        const encoding=captureEncoding()
        res=await auth.faceLogin(encoding)
      }
      setToken(res.token)
      const me=await auth.me()
      setUser(me)
      router.push('/chat')
    }catch(e:any){
      setError(e.message||'Something went wrong')
    }finally{setLoading(false)}
  }

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
      <div className="bubble-bg" id="authBubbles"/>

      <div style={{width:'100%',maxWidth:'420px',padding:'0 16px',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{fontFamily:'Space Grotesk',fontSize:'28px',fontWeight:600,color:'var(--accent)',marginBottom:'6px'}}>BaatKaro</div>
          <p style={{fontSize:'14px',color:'var(--text-secondary)'}}>Your AI assistant — chat, voice, and documents</p>
        </div>

        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'14px',padding:'28px 24px'}}>
          <div style={{display:'flex',gap:'6px',marginBottom:'24px',background:'var(--sidebar)',borderRadius:'8px',padding:'4px'}}>
            {(['login','register','face'] as Mode[]).map(m=>(
              <button key={m} onClick={()=>{setMode(m);setError('')}} style={{flex:1,padding:'7px',borderRadius:'6px',border:'none',fontSize:'12px',fontWeight:500,background:mode===m?'var(--surface)':'transparent',color:mode===m?'var(--accent)':'var(--text-secondary)',boxShadow:mode===m?'0 1px 3px rgba(0,0,0,0.08)':'none',transition:'all 0.15s'}}>
                {m==='login'?'Sign in':m==='register'?'Register':'Face ID'}
              </button>
            ))}
          </div>

          {error&&<div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:'7px',padding:'9px 12px',fontSize:'13px',color:'#DC2626',marginBottom:'16px'}}>{error}</div>}

          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {mode==='register'&&(
              <div>
                <label style={{fontSize:'12px',color:'var(--text-secondary)',marginBottom:'5px',display:'block'}}>Full name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Asad Ahmad" style={{width:'100%',padding:'9px 12px',border:'1px solid var(--border)',borderRadius:'7px',fontSize:'13px',background:'var(--bg)',color:'var(--text-primary)',outline:'none'}}/>
              </div>
            )}
            {mode!=='face'&&(
              <>
                <div>
                  <label style={{fontSize:'12px',color:'var(--text-secondary)',marginBottom:'5px',display:'block'}}>Email</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={{width:'100%',padding:'9px 12px',border:'1px solid var(--border)',borderRadius:'7px',fontSize:'13px',background:'var(--bg)',color:'var(--text-primary)',outline:'none'}}/>
                </div>
                <div>
                  <label style={{fontSize:'12px',color:'var(--text-secondary)',marginBottom:'5px',display:'block'}}>Password</label>
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={{width:'100%',padding:'9px 12px',border:'1px solid var(--border)',borderRadius:'7px',fontSize:'13px',background:'var(--bg)',color:'var(--text-primary)',outline:'none'}}/>
                </div>
              </>
            )}

            {(mode==='register'||mode==='face')&&(
              <div>
                <label style={{fontSize:'12px',color:'var(--text-secondary)',marginBottom:'6px',display:'block'}}>
                  {mode==='register'?'Face capture (for Face ID)':'Look at camera and click Sign in'}
                </label>
                <video ref={videoRef} autoPlay muted playsInline style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',background:'#000',aspectRatio:'4/3',objectFit:'cover'}}/>
                <canvas ref={canvasRef} style={{display:'none'}}/>
              </div>
            )}
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{width:'100%',marginTop:'20px',padding:'10px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:500,opacity:loading?0.7:1,transition:'all 0.15s'}}>
            {loading?'Please wait...':(mode==='login'?'Sign in':mode==='register'?'Create account':'Sign in with Face')}
          </button>
        </div>
      </div>


    </div>
  )
}