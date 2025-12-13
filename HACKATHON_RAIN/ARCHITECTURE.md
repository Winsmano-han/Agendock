# AgentDock Architecture (Phase A)

## High-level vision

Platform where any small business can create an AI WhatsApp agent:

1. Business owner visits the web app, signs up, and registers their business.
2. They configure services/products, opening hours, and basic preferences.
3. The platform connects to WhatsApp Cloud API and exposes a webhook URL.
4. Customers chat with the business via WhatsApp; the AI agent handles messages.
5. Orders/appointments and customers are stored and visible in a dashboard.

For the hackathon demo, we implement this for a **barber** tenant and keep the architecture ready for multiple tenants.

## Services

- `whatsapp-service`
  - Receives WhatsApp Cloud API webhooks (`/webhook/whatsapp`).
  - Verifies webhook token (GET) and accepts messages (POST).
  - Persists raw messages via the API service or directly via a message queue.
  - Publishes jobs to the worker.

- `api-service`
  - Provides REST endpoints for tenants, products/services, customers, orders/appointments.
  - Used by the web dashboard and internal services.
  - Enforces tenant separation.

- `ai-service`
  - Encapsulates LLM calls and prompt templates.
  - Takes structured input (tenant, customer, last messages, product catalog).
  - Returns:
    - Natural-language reply text.
    - Optional structured actions, e.g. `{"action": "CREATE_APPOINTMENT", ...}`.

- `worker-service`
  - Consumes jobs from a queue (e.g. Redis via Celery).
  - Calls `ai-service` for conversation understanding.
  - Calls `api-service` to create/update orders, appointments, customers, and events.
  - Triggers social media event generation (later phases).

## Multi-tenant model (simplified)

Core DB tables (conceptual):

- `tenants` – each business (e.g. barber).
- `agents` – configuration per tenant for their AI agent (welcome text, language defaults, opening hours).
- `whatsapp_channels` – WhatsApp phone / configuration per tenant (for hackathon we can share a single test number and route by internal mapping).
- `customers` – end customers messaging on WhatsApp.
- `appointments` or `orders` – bookings for the barber or orders for other businesses.
- `messages` – in/out messages for history and analytics.

In a production multi-tenant setup, each incoming message is resolved to a tenant using:

- The target WhatsApp business number (or a dedicated phone per tenant).
- Potentially a mapping sent in the webhook metadata.

For the hackathon, we can:

- Use one WhatsApp Cloud API sandbox number.
- Assume a single barber tenant in the DB.
- Keep the tenant ID as a constant or config in the worker/whatsapp services.

## Data flow (barber demo)

1. Customer sends a WhatsApp message to the barber number.
2. WhatsApp Cloud API calls our `whatsapp-service` webhook.
3. `whatsapp-service`:
   - Validates the request.
   - Extracts `from` (customer phone), message text, and metadata.
   - Enqueues a job to the worker with `{tenant_id, customer_phone, message_text}`.
4. `worker-service`:
   - Ensures a `customer` record exists for `customer_phone` under `tenant_id`.
   - Fetches tenant configuration (e.g. barber services, opening hours).
   - Calls `ai-service` with context and message.
   - Receives `reply_text` + optional actions.
   - If action = `CREATE_APPOINTMENT`, calls `api-service` to create an appointment.
   - Calls WhatsApp Cloud API to send `reply_text` back to the customer.
5. `api-service`:
   - Exposes endpoints for dashboard to list appointments, customers, messages.
   - Supports creating and editing barber services and schedule.

## Initial endpoints (Phase A skeleton)

These endpoints are defined as stubs in the code:

- `whatsapp-service`
  - `GET /webhook/whatsapp` – webhook verification.
  - `POST /webhook/whatsapp` – receive messages and push to worker.

- `api-service`
  - `GET /health` – simple health check.
  - (Later) `POST /tenants`, `GET /tenants/{id}`, etc.

- `ai-service`
  - `POST /generate-reply` – input: `{tenant_id, customer_id, message}`; output: `{reply_text, actions}` (stubbed now).

- `worker-service`
  - Defines Celery tasks like `process_incoming_message` (stubbed now).

## Sequence example (appointment booking)

1. Customer: “Hi, can I book a haircut for tomorrow afternoon?”
2. Webhook receives message -> worker job.
3. Worker calls AI:
   - AI detects intent: appointment booking.
   - AI checks barber’s opening hours and available slots (via API).
   - AI returns:
     - Reply suggesting available times.
     - Proposed appointment action.
4. Worker persists appointment and sends confirmation message to customer via WhatsApp API.
5. Barber sees the booking in the dashboard.







cd C:\Users\DELL\Desktop\HACKATHON_RAIN
.\.venv\Scripts\activate

# now you can go into any service and run python
cd services\ai
python app.py

# in another terminal:
cd C:\Users\DELL\Desktop\HACKATHON_RAIN
.\.venv\Scripts\activate
cd services\api
python app.py

# and for WhatsApp:
cd C:\Users\DELL\Desktop\HACKATHON_RAIN
.\.venv\Scripts\activate
cd services\whatsapp
python app.py

for the front end

cd .\agentdock-frontend\
$env:PATH = "$PWD\node;$env:PATH"
node\npm run dev -- --port 3002