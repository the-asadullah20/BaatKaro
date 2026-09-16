# BaatKaro frontend

BaatKaro is an AI conversation assistant with text chat, voice input, PDF-assisted answers, and face-based authentication. This directory contains the Next.js frontend.

## Local development

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The backend API should be running separately and configured through the environment variables expected by `src/lib/api.ts`.

Create a production build with:

```sh
npm run build
```

## Main features

- Text conversations with the BaatKaro assistant
- Voice recording and text-to-speech playback
- PDF uploads for document-aware conversations
- Face capture during authentication
- Light and dark themes

The project uses [Next.js](https://nextjs.org/docs) with the App Router.
