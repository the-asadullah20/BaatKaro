import type {Metadata} from 'next'
import '@/app/globals.css'

export const metadata:Metadata={
  title:'BaatKaro | AI Conversation Assistant',
  description:'Chat with an AI assistant using text, voice, and document uploads.',
}

export default function RootLayout({children}:{children:React.ReactNode}){
  return(
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"/>
      </head>
      <body>{children}</body>
    </html>
  )
}