'use client'
import {useState,useCallback} from 'react'
import {pdf} from '@/lib/api'

interface Props{onClose:()=>void;onUploaded:()=>void}

export default function PdfUpload({onClose,onUploaded}:Props){
  const[dragging,setDragging]=useState(false)
  const[uploading,setUploading]=useState(false)
  const[error,setError]=useState('')

  const handleFile=useCallback(async(file:File)=>{
    if(!file.name.endsWith('.pdf')){setError('Only PDF files allowed');return}
    setUploading(true);setError('')
    try{
      await pdf.upload(file)
      onUploaded()
    }catch(e:any){
      setError(e.message||'Upload failed')
    }finally{setUploading(false)}
  },[onUploaded])

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'14px',padding:'24px',width:'100%',maxWidth:'400px',margin:'0 16px'}}>
        <div style={{display:'flex',alignItems:'center',marginBottom:'16px'}}>
          <span style={{fontFamily:'Space Grotesk',fontSize:'15px',fontWeight:500,flex:1,color:'var(--text-primary)'}}>Upload PDF</span>
          <button onClick={onClose} style={{width:'28px',height:'28px',border:'none',background:'transparent',color:'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'6px'}}>
            <i className="ti ti-x" style={{fontSize:'16px'}} aria-hidden="true"/>
          </button>
        </div>

        <div
          onDragOver={e=>{e.preventDefault();setDragging(true)}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)handleFile(f)}}
          onClick={()=>document.getElementById('pdfInput')?.click()}
          style={{border:`2px dashed ${dragging?'var(--accent)':'var(--border)'}`,borderRadius:'10px',padding:'32px 16px',textAlign:'center',cursor:'pointer',background:dragging?'var(--accent-light)':'transparent',transition:'all 0.15s'}}
        >
          <i className="ti ti-file-upload" style={{fontSize:'32px',color:'var(--accent)',marginBottom:'8px',display:'block'}} aria-hidden="true"/>
          <p style={{fontSize:'13px',color:'var(--text-secondary)',marginBottom:'4px'}}>Drop PDF here or click to browse</p>
          <p style={{fontSize:'11px',color:'var(--text-muted)'}}>Max 10MB</p>
          <input id="pdfInput" type="file" accept=".pdf" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f)}}/>
        </div>

        {error&&<p style={{fontSize:'12px',color:'#DC2626',marginTop:'10px'}}>{error}</p>}
        {uploading&&<p style={{fontSize:'12px',color:'var(--accent)',marginTop:'10px',textAlign:'center'}}>Uploading and processing...</p>}
      </div>
    </div>
  )
}