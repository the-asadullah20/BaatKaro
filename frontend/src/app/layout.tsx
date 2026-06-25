import type {Metadata} from 'next'
import '@/app/globals.css'

export const metadata:Metadata={
  title:'BaatKaro',
  description:'Your AI Assistant',
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