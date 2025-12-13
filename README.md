# AgentDock (Hackathon Build)

Multi-tenant AI agents for small businesses, with WhatsApp (Twilio Sandbox) + web chat, real-time conversations, RAG for uploads, and “agentic” tools (appointments, orders, handoffs).

## What’s inside

- `HACKATHON_RAIN/services/api` — Flask API + SQLite (tenants, profiles, conversations, tools, trace)
- `HACKATHON_RAIN/services/ai` — AI service (Groq client + fallback + consistent error messaging)
- `HACKATHON_RAIN/services/whatsapp` — Twilio webhook receiver (WhatsApp sandbox)
- `HACKATHON_RAIN/agentdock-frontend` — Next.js dashboard + chat UI

## Local setup (Windows / PowerShell)

1) From `D:\Hackathon V2 twilo\HACKATHON_RAIN`:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-all.ps1 -KillPorts
```

2) Open:
- Frontend: `http://localhost:3002`
- API: `http://localhost:5000`

Stop everything:

```powershell
powershell -ExecutionPolicy Bypass -File .\stop-all.ps1
```

## Secrets / env

Do not commit `.env` files. Use the examples and create real `.env` locally:
- `HACKATHON_RAIN/services/ai/.env.example`
- `HACKATHON_RAIN/services/whatsapp/.env.example`

## Deployment (frontend)

See `HACKATHON_RAIN/agentdock-frontend/DEPLOYMENT.md`.

Quick summary:
- Deploy **frontend** to Vercel or Render.
- Set `NEXT_PUBLIC_API_BASE_URL` to your **public API URL**.

## Notes for hackathon demos

- Multi-tenant: each business gets a `business_code` shown on dashboard; WhatsApp routing supports `START-<BUSINESS_CODE>`.
- RAG: upload PDFs/DOCX/TXT under “Knowledge”; retrieval injects top chunks into replies.
- Agent tools: `CREATE_APPOINTMENT`, `CHECK_AVAILABILITY`, `QUOTE_PRICE`, `CREATE_ORDER`, `ESCALATE_TO_HUMAN`.
- Ops UX: Orders + Handoffs pages support assignment, SLA due time, and resolution notes.
- Observability: “Trace” page shows model used + tool calls + retrieved KB chunk ids.

