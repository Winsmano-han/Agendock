import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/15" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/15" />
          <div className="absolute top-20 right-1/3 h-72 w-72 rounded-full bg-purple-400/10 blur-3xl dark:bg-purple-500/10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                Hackathon-ready agentic WhatsApp AI
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Build a multi‑tenant WhatsApp AI agent that actually{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  books, sells, and answers
                </span>
                .
              </h1>

              <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-xl">
                AgentDock gives each business a unique Business ID, a storefront
                profile, true retrieval over business knowledge, and an agent
                with tool‑calling actions (appointments, pricing, availability,
                orders, escalation).
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition"
                >
                  Create a business
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/agent-preview"
                  className="inline-flex items-center justify-center rounded-xl border border-transparent bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition"
                >
                  Live preview
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 max-w-xl">
                {[
                  { k: 'Tool-calling', v: 'Bookings + orders + pricing' },
                  { k: 'RAG', v: 'Relevant chunks with citations' },
                  { k: 'Tenants', v: 'Business ID routing per shop' },
                  { k: 'Ops', v: 'Reset demo + conversation inbox' },
                ].map((item) => (
                  <div
                    key={item.k}
                    className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {item.k}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {item.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Demo flow
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      Customer → WhatsApp → Business
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white">
                    Agentic
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  {[
                    {
                      t: '1) Join sandbox',
                      d: 'Customers join the Twilio sandbox link once.',
                    },
                    {
                      t: '2) Send Business ID',
                      d: 'START-<BusinessID> routes them to the right tenant.',
                    },
                    {
                      t: '3) Ask anything',
                      d: 'The AI retrieves knowledge + calls tools to act.',
                    },
                    {
                      t: '4) Owner sees inbox',
                      d: 'Conversations are grouped per customer thread.',
                    },
                  ].map((row) => (
                    <div
                      key={row.t}
                      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {row.t}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        {row.d}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 sm:mt-20">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Built to survive judge testing
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Clear tenant isolation, predictable fallback messaging, and a
                “reset demo” button so your UI always matches your DB state.
              </p>
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Conversation inbox',
                  body: 'Clickable threads per customer with AI summaries and live refresh.',
                },
                {
                  title: 'Business knowledge',
                  body: 'Paste policies/menus and get retrieval + citations in answers.',
                },
                {
                  title: 'Actions, not chat',
                  body: 'Appointments, orders, availability checks, and escalation hooks.',
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {card.title}
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
