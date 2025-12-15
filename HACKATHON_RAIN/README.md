# AgentDock - AI-Powered Business Automation Platform

🤖 **Multi-tenant AI agents for small businesses** with WhatsApp integration, real-time conversations, RAG knowledge base, and advanced "agentic" tools for appointments, orders, and customer management.

## 🚀 What Makes AgentDock Special

**Universal Business Support**: Works for ANY business type - restaurants, spas, clinics, salons, gyms, retail, professional services, and more.

**Advanced AI Features**:
- 🧠 **Multi-Language AI**: Auto-detects and responds in customer's language (Spanish, French, German, Portuguese, Italian)
- 🎭 **Agent Personalities**: Customizable AI personality matching your brand voice (professional, casual, luxury, energetic)
- 📱 **WhatsApp Notifications**: Instant alerts to business owners for new bookings, orders, and complaints
- 📊 **Business Intelligence**: Real-time analytics, sentiment analysis, and optimization suggestions
- 🎨 **Social Media Generator**: AI creates promotional content for Instagram, Facebook, Twitter, LinkedIn
- 👥 **Customer Personalization**: VIP treatment, communication preferences, and smart recommendations
- 🛡️ **Enterprise Security**: Anti-jailbreaking protection and rate limiting

## 🏗️ Architecture

- `services/api` – Flask API + SQLite (tenants, profiles, conversations, analytics, complaints)
- `services/ai` – AI service (Groq/Llama with multi-language support and personality system)
- `services/whatsapp` – Twilio webhook receiver (WhatsApp sandbox + Cloud API)
- `agentdock-frontend` – Next.js dashboard with advanced AI features UI

## 🌍 Supported Business Types

**Service Businesses**: Barbers, Salons, Spas, Gyms, Clinics, Dental
**Hospitality**: Restaurants, Cafes, Hotels
**Professional**: Legal, Accounting, Consulting, Tutoring
**Retail**: Stores, Auto services, Photography
**Home Services**: Cleaning, Pet care

Each business type gets industry-specific AI personality and terminology.

## 🛠️ Local Setup (Windows / PowerShell)

1) From `D:\Hackathon V2 twilo\HACKATHON_RAIN`:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-all.ps1 -KillPorts
```

2) Open:
- Frontend: `http://localhost:3002`
- API: `http://localhost:5000`
- AI Service: `http://localhost:5002`

Stop everything:

```powershell
powershell -ExecutionPolicy Bypass -File .\stop-all.ps1
```

## 🔑 Environment Setup

Do not commit `.env` files. Use the examples and create real `.env` locally:
- `services/ai/.env.example`
- `services/whatsapp/.env.example`

Required API keys:
- **GROQ_API_KEY**: For AI language model
- **TWILIO_ACCOUNT_SID** & **TWILIO_AUTH_TOKEN**: For WhatsApp notifications

## 🌐 Deployment

**Frontend**: Deployed to Vercel (`https://agendock-xi.vercel.app`)
**API**: Deployed to Render (`https://agendock.onrender.com`)

Set `NEXT_PUBLIC_API_BASE_URL` to your public API URL.

## 📊 Observability & Monitoring

- **Trace Page**: Shows model usage, tool calls, retrieved KB chunks, and errors
- **Real-Time Events**: Server-sent events for live dashboard updates
- **Conversation Analytics**: Customer behavior and interaction patterns
- **Performance Metrics**: Response times, success rates, error tracking

## 🏆 Key Features for Hackathon Demo

### Multi-Tenant Business Management
- Each business gets a unique `business_code` (e.g., AG6ZPM3)
- WhatsApp routing supports `START-<BUSINESS_CODE>`
- Complete business profile customization

### Advanced AI Capabilities
- **RAG Knowledge Base**: Upload PDFs/DOCX/TXT, get citations in responses
- **Agent Tools**: `CREATE_APPOINTMENT`, `CHECK_AVAILABILITY`, `QUOTE_PRICE`, `CREATE_ORDER`, `ESCALATE_TO_HUMAN`, `CREATE_COMPLAINT`
- **Multi-Language**: Automatic language detection and response
- **Personality System**: 17+ business types with custom communication styles

### Business Intelligence
- **Analytics Dashboard**: Peak hours, popular services, revenue trends
- **Sentiment Analysis**: Customer satisfaction tracking
- **Optimization Suggestions**: AI-powered business recommendations
- **Social Media Content**: Auto-generated promotional posts

### Operational Excellence
- **Orders Management**: Assignment, SLA tracking, resolution notes
- **Complaints System**: Priority levels, categorization, agent assignment
- **Customer Personalization**: VIP treatment, communication preferences
- **WhatsApp Notifications**: Real-time alerts to business owners

### Security & Reliability
- **Anti-Jailbreaking**: Multi-layer protection against prompt injection
- **Rate Limiting**: Prevents abuse and maintains service quality
- **Response Filtering**: Prevents system information leakage
- **Enterprise-Grade**: Production-ready security measures
