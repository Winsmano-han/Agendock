# Frontend Deployment (Vercel / Render)

This frontend is a Next.js app. It needs the API base URL reachable publicly.

## Vercel (recommended)

1) Push the repo to GitHub.
2) In Vercel, **Import Project** → select the repo.
3) Set:
   - **Root Directory**: `HACKATHON_RAIN/agentdock-frontend`
4) Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://YOUR_PUBLIC_API_URL`

Notes:
- If your API is still running locally, you can use ngrok for the API only:
  - `C:\Tools\ngrok\ngrok.exe http 5000`
  - Copy the ngrok URL (e.g. `https://xxxx.ngrok-free.dev`) and set it as `NEXT_PUBLIC_API_BASE_URL`.
- SSE (realtime updates) uses the same base URL and requires the API publicly accessible.

## Render (web service)

1) Create a new **Web Service** on Render and connect your GitHub repo.
2) Set:
   - **Root Directory**: `HACKATHON_RAIN/agentdock-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start -- --port $PORT`
3) Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://YOUR_PUBLIC_API_URL`

## What to deploy for the API

For a proper demo, deploy the API as well (Render/Fly/railway/etc). If you keep the API local, Vercel users won’t be able to log in or use conversations unless the API is tunneled publicly.

