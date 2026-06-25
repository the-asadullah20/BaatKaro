'use client'
import {useEffect,useRef,useState} from 'react'

interface Props{
  onCapture:(encoding:number[])=>void
  label?:string
}

export default function FaceCapture({onCapture,label}:Props){
  const videoRef=useRef<HTMLVideoElement>(null)
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const streamRef=useRef<MediaStream|null>(null)
  const[ready,setReady]=useState(false)
  const[error,setError]=useState('')

  useEffect(()=>{
    startCamera()
    return()=>stopCamera()
  },[])

  async function startCamera(){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:true})
      streamRef.current=stream
      if(videoRef.current)videoRef.current.srcObject=stream
      setReady(true)
    }catch{
      setError('Camera access denied')
    }
  }

  function stopCamera(){
    streamRef.current?.getTracks().forEach(t=>t.stop())
    streamRef.current=null
  }

  function capture(){
    const canvas=canvasRef.current!
    const video=videoRef.current!
    const ctx=canvas.getContext('2d')!
    canvas.width=128;canvas.height=128
    ctx.drawImage(video,0,0,128,128)
    const data=ctx.getImageData(0,0,128,128).data
    const encoding:number[]=[]
    for(let i=0;i<data.length;i+=16)encoding.push(data[i]/255)
    onCapture(encoding)
  }

  return(
    <div>
      {label&&<label style={{fontSize:'12px',color:'var(--text-secondary)',marginBottom:'6px',display:'block'}}>{label}</label>}
      {error?(
        <div style={{padding:'12px',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:'8px',fontSize:'13px',color:'#DC2626'}}>{error}</div>
      ):(
        <div style={{position:'relative'}}>
          <video ref={videoRef} autoPlay muted playsInline style={{width:'100%',borderRadius:'8px',border:'1px solid var(--border)',background:'#000',aspectRatio:'4/3',objectFit:'cover',display:'block'}}/>
          <canvas ref={canvasRef} style={{display:'none'}}/>
          {ready&&(
            <button onClick={capture} style={{position:'absolute',bottom:'8px',left:'50%',transform:'translateX(-50%)',padding:'6px 16px',background:'var(--accent)',color:'#fff',border:'none',borderRadius:'6px',fontSize:'12px',fontWeight:500,cursor:'pointer'}}>
              <i className="ti ti-camera" aria-hidden="true"/> Capture
            </button>
          )}
        </div>
      )}
    </div>
  )
}