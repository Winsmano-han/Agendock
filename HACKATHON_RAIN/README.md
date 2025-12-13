# AgentDock Hackathon Platform

Multi-tenant platform for small businesses to spin up their own WhatsApp AI agents. Each business signs up on the web, configures their details, and gets an AI assistant that chats with their customers on WhatsApp, takes orders, and updates a simple CRM/dashboard.

This repo is structured as a small mono-repo with separate services for WhatsApp integration, AI orchestration, background workers, and API/dashboard.

## Repo structure

- `services/whatsapp` – Flask service that receives WhatsApp Cloud API webhooks and hands messages to the worker.
- `services/api` – Backend API (Flask) for tenants (businesses), products, orders, and customers. Used by the web dashboard.
- `services/ai` – AI facade for calling the LLM (e.g. Llama 3) with prompt templates and returning replies + structured actions.
- `services/worker` – Celery workers that process messages, create orders, and trigger events (e.g. social posts).
- `web/dashboard` – Frontend (to be implemented later) where businesses sign up and manage their agents.
- `infra` – Infrastructure configs (e.g. Docker Compose, environment samples).

For the hackathon demo, the main test tenant is a **barber shop**. The barber signs up, defines services (haircut types, prices, opening hours), and gets a WhatsApp AI agent that:

- Greets and answers questions.
- Books appointments.
- Sends confirmation messages.
