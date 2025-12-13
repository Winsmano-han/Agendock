'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/hooks/useTenant'
import { api } from '@/utils/api'

type TraceRow = {
  id: number
  tenant_id: number
  customer_id: number | null
  customer_phone: string | null
  message_in_id: number | null
  model_used: string | null
  kb_chunk_ids: string | null
  actions: any[] | null
  tool_results: any[] | null
  error_type: string | null
  created_at: string
}

export default function TracePage() {
  const { tenantId, mounted } = useTenant()
  const router = useRouter()
  const [rows, setRows] = useState<TraceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<number | null>(null)

  useEffect(() => {
    if (!mounted) return
    if (!tenantId) {
      router.replace('/login')
      return
    }

    const load = async () => {
      try {
        const data = await api.getTrace(tenantId)
        setRows(Array.isArray(data) ? (data as TraceRow[]) : [])
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenantId, mounted, router])

  useEffect(() => {
    if (!mounted || !tenantId) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const url = `${location.protocol}//${location.hostname}:5000/tenants/${tenantId}/events${
      token ? `?token=${encodeURIComponent(token)}` : ''
    }`
    let es: EventSource | null = null
    try {
      es = new EventSource(url)
      es.addEventListener('tenant_event', async (evt) => {
        try {
          const parsed = JSON.parse((evt as MessageEvent).data || '{}')
          if (parsed?.type === 'message_out' || parsed?.type === 'message_in') {
            const data = await api.getTrace(tenantId)
            setRows(Array.isArray(data) ? (data as TraceRow[]) : [])
          }
        } catch {
          // ignore
        }
      })
    } catch {
      // ignore SSE setup errors
    }
    return () => {
      try {
        es?.close()
      } catch {
        // ignore
      }
    }
  }, [tenantId, mounted])

  const active = useMemo(
    () => rows.find((r) => r.id === activeId) || null,
    [rows, activeId],
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-300 text-sm">Loading traces…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Debug trace</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Owner-only view of model selection, tool calls, KB retrieval, and errors.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
            {rows.length === 0 ? (
              <div className="p-6 text-sm text-slate-600 dark:text-slate-300">
                No traces yet. Send a WhatsApp/web message to generate tool calls and retrieval.
              </div>
            ) : (
              <div className="max-h-[32rem] overflow-y-auto">
                {rows.map((r) => {
                  const isActive = r.id === activeId
                  const ts = new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  const hasError = !!r.error_type
                  const kb = (r.kb_chunk_ids || '').split(',').filter(Boolean).length
                  const actions = Array.isArray(r.actions) ? r.actions.length : 0
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setActiveId(r.id)}
                      className={[
                        'w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900',
                        isActive ? 'bg-slate-50 dark:bg-slate-900' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {r.model_used || 'model'}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {r.customer_phone || 'unknown customer'} · {ts}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          {kb > 0 && (
                            <span className="rounded-full bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-200 px-2 py-0.5 font-medium">
                              KB {kb}
                            </span>
                          )}
                          {actions > 0 && (
                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 font-medium">
                              Tools {actions}
                            </span>
                          )}
                          {hasError && (
                            <span className="rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200 px-2 py-0.5 font-medium">
                              {r.error_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
            {!active ? (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Select a trace on the left.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Trace #{active.id}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(active.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">Model:</span> {active.model_used || '—'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Customer</div>
                    <div className="mt-2 font-mono text-xs text-slate-900 dark:text-slate-100 break-all">
                      {active.customer_phone || 'unknown'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">KB chunk ids</div>
                    <div className="mt-2 font-mono text-xs text-slate-900 dark:text-slate-100 break-all">
                      {active.kb_chunk_ids || '—'}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Actions</div>
                  <pre className="mt-2 text-xs text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                    {JSON.stringify(active.actions || [], null, 2)}
                  </pre>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tool results</div>
                  <pre className="mt-2 text-xs text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                    {JSON.stringify(active.tool_results || [], null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
