# AgentDock Frontend

A modern Next.js frontend for the AgentDock platform - where small businesses can spin up AI WhatsApp agents in minutes.

## Features

- **Landing Page**: Hero section with clear value proposition and CTAs
- **User Authentication**: Simple signup/login flow with tenant management
- **Business Onboarding**: Multi-step form to configure business profile
- **Dashboard**: Overview of business settings and AI agent status
- **AI Chat Testing**: Built-in chat playground to test the AI agent

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hooks** for state management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on http://localhost:5000

### Installation

1. Clone and navigate to the project:
```bash
cd agentdock-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
copy .env.local.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

### API Base URL

The frontend connects to the backend API. Configure the API base URL in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

For production, update this to your production API URL.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── signup/            # Signup flow
│   ├── login/             # Login flow  
│   ├── onboarding/        # Business profile setup
│   └── dashboard/         # Main dashboard
├── components/            # Reusable React components
│   ├── Navbar.tsx         # Navigation component
│   └── ChatPlayground.tsx # AI chat testing
├── hooks/                 # Custom React hooks
│   └── useTenant.ts       # Tenant state management
└── utils/                 # Utility functions
    └── api.ts             # API client and types
```

## API Integration

The frontend integrates with these backend endpoints:

- `POST /tenants` - Create new business tenant
- `GET /tenants/{id}/business-profile` - Get business profile
- `PUT /tenants/{id}/business-profile` - Update business profile  
- `POST /demo/chat` - Test AI chat functionality
- `POST /agents` - Create AI agent (optional)

## Demo Flow

1. **Landing Page** (`/`) - Marketing page with signup/login CTAs
2. **Signup** (`/signup`) - Create new business account
3. **Onboarding** (`/onboarding`) - 6-step business profile setup
4. **Dashboard** (`/dashboard`) - Business overview and AI agent testing

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Create components in `src/components/`
2. Add pages in `src/app/`
3. Use the `api` utility for backend calls
4. Follow TypeScript best practices

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to your preferred platform (Vercel, Netlify, etc.)

3. Update environment variables for production API URL

## Hackathon Demo Tips

- Use tenant ID `1` for quick demo login
- The onboarding flow showcases the complete business setup
- Chat playground demonstrates AI agent functionality
- Responsive design works on mobile for live demos