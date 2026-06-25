'use client'
import {useState,useRef} from 'react'
import {media} from '@/lib/api'
interface Props{
  onTranscript:(text:string)=>void
  lastReply?:string
}
export default function AudioRecorder({onTranscript,lastReply}:Props){
  const[recording,setRecording]=useState(false)
  const[playing,setPlaying]=useState(false)
  const mediaRef=useRef<MediaRecorder|null>(null)
  const chunksRef=useRef<Blob[]>([])
  const audioRef=useRef<HTMLAudioElement|null>(null)
  async function toggle(){
    if(recording){
      mediaRef.current?.stop()
      setRecording(false)
    }else{
      try{
        const stream=await navigator.mediaDevices.getUserMedia({audio:true})
        const mr=new MediaRecorder(stream)
        chunksRef.current=[]
        mr.ondataavailable=e=>chunksRef.current.push(e.data)
        mr.onstop=async()=>{
          const blob=new Blob(chunksRef.current,{type:'audio/webm'})
          stream.getTracks().forEach(t=>t.stop())
          try{
            const res=await media.stt(blob)
            if(res.text)onTranscript(res.text)
          }catch{}
        }
        mr.start(100)
        mediaRef.current=mr
        setRecording(true)
      }catch{}
    }
  }
  async function playTTS(){
    if(!lastReply)return
    try{
      setPlaying(true)
      const blob=await media.tts(lastReply.replace(/\*/g,''))
      const url=URL.createObjectURL(blob)
      const audio=new Audio(url)
      audioRef.current=audio
      audio.onended=()=>{setPlaying(false);URL.revokeObjectURL(url)}
      audio.play()
    }catch{setPlaying(false)}
  }
  function stopTTS(){
    audioRef.current?.pause()
    setPlaying(false)
  }
  return(
    <div style={{display:'flex',gap:'4px'}}>
      <button onClick={toggle} title={recording?'Stop recording':'Record voice'} style={{width:'28px',height:'28px',borderRadius:'6px',border:'none',background:recording?'var(--accent-light)':'transparent',color:recording?'var(--accent)':'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
        <i className={`ti ti-microphone${recording?'-off':''}`} style={{fontSize:'15px'}} aria-hidden="true"/>
      </button>
      {lastReply&&(
        <button onClick={playing?stopTTS:playTTS} title={playing?'Stop':'Play response'} style={{width:'28px',height:'28px',borderRadius:'6px',border:'none',background:playing?'var(--accent-light)':'transparent',color:playing?'var(--accent)':'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
          <i className={`ti ti-${playing?'player-stop':'volume'}`} style={{fontSize:'15px'}} aria-hidden="true"/>
        </button>
      )}
    </div>
  )
}