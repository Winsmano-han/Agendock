'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTenant } from '@/hooks/useTenant'
import { useSidebar } from '@/contexts/SidebarContext'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { tenantId, clearTenant, mounted } = useTenant()
  const { toggleCollapsed } = useSidebar()
  const [ready, setReady] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Wait for client-side hydration so hooks/localStorage are stable
  useEffect(() => {
    if (mounted) {
      // Initialize theme from localStorage (default to light)
      try {
        const stored = window.localStorage.getItem('agentdock_theme')
        const initial =
          stored === 'dark' || stored === 'light' ? stored : 'light'
        setTheme(initial)
        if (initial === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      } catch {
        document.documentElement.classList.remove('dark')
        setTheme('light')
      }
      setReady(true)
    }
  }, [mounted])

  const handleLogout = () => {
    clearTenant()
    router.push('/login')
  }

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      window.localStorage.setItem('agentdock_theme', next)
    } catch {
      // ignore
    }
  }

  if (!ready) {
    return null
  }

  const linkBase =
    'text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors'

  const isActive = (path: string) => pathname === path

  const AuthLinks = () => {
    if (tenantId) return null
    
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/login"
          className={`${linkBase} ${
            isActive('/login') ? 'text-blue-600 dark:text-blue-400' : ''
          }`}
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 transition"
        >
          Get started
        </Link>
      </div>
    )
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30">
              A
            </span>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                AgentDock
              </div>
              <div className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">
                AI WhatsApp agents • multi-tenant • RAG
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {tenantId && (
              <button
                type="button"
                onClick={toggleCollapsed}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Toggle sidebar"
              >
                ☰
              </button>
            )}
            <AuthLinks />
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </div>


    </nav>
  )
}
