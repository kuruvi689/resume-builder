# Resume Builder

5 MNC-grade resume templates · Grok AI ATS analysis · .doc download

## Setup

1. Clone this repo
2. `npm install`
3. Add your Grok API key to `.env.local`:
   ```
   GROK_API_KEY=xai-xxxxxxxxxxxxxxxxxxxx
   ```
4. `npm run dev` → open http://localhost:3000

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variable: `GROK_API_KEY` = your xAI key
4. Deploy

Get your Grok API key free at: https://console.x.ai

## Stack
- Next.js 14
- Grok AI (xAI) via serverless API route
- No database, no auth required
