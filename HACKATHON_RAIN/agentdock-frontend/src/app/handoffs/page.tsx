'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/hooks/useTenant'
import { api } from '@/utils/api'

type Handoff = {
  id: number
  tenant_id: number
  customer_id: number | null
  reason: string | null
  status: 'open' | 'resolved'
  assigned_to?: string | null
  due_at?: string | null
  resolution_notes?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at?: string
}

export default function HandoffsPage() {
  const { tenantId, mounted } = useTenant()
  const router = useRouter()
  const [handoffs, setHandoffs] = useState<Handoff[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!mounted) return
    if (!tenantId) {
      router.replace('/login')
      return
    }
    const load = async () => {
      try {
        const data = await api.getHandoffs(tenantId)
        setHandoffs(Array.isArray(data) ? data : [])
      } catch {
        setHandoffs([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenantId, mounted, router])

  useEffect(() => {
    if (!mounted || !tenantId) return

    const token =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('auth_token')
        : null
    const url = `${location.protocol}//${location.hostname}:5000/tenants/${tenantId}/events${
      token ? `?token=${encodeURIComponent(token)}` : ''
    }`

    let stopped = false
    const refresh = async () => {
      if (stopped) return
      try {
        const data = await api.getHandoffs(tenantId)
        setHandoffs(Array.isArray(data) ? data : [])
      } catch {
        // ignore
      }
    }

    let es: EventSource | null = null
    try {
      es = new EventSource(url)
      es.addEventListener('tenant_event', (evt) => {
        try {
          const parsed = JSON.parse((evt as MessageEvent).data || '{}')
          if (
            parsed?.type === 'handoff_created' ||
            parsed?.type === 'handoff_updated'
          ) {
            refresh()
          }
        } catch {
          // ignore
        }
      })
    } catch {
      // ignore
    }

    return () => {
      stopped = true
      try {
        es?.close()
      } catch {
        // ignore
      }
    }
  }, [tenantId, mounted])

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  const counts = useMemo(() => {
    const open = handoffs.filter((h) => h.status === 'open').length
    return { open, resolved: handoffs.length - open }
  }, [handoffs])

  const updateHandoff = async (
    handoffId: number,
    patch: {
      status?: Handoff['status']
      assigned_to?: string | null
      due_at?: string | null
      resolution_notes?: string | null
    },
  ) => {
    if (!tenantId) return
    setUpdatingId(handoffId)
    try {
      const updated = (await api.updateHandoff(handoffId, patch)) as Partial<Handoff>
      setHandoffs((prev) =>
        prev.map((h) => (h.id === handoffId ? ({ ...h, ...updated } as Handoff) : h)),
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const formatSla = (dueAt?: string | null) => {
    if (!dueAt) return null
    const due = new Date(dueAt).getTime()
    const now = Date.now()
    const diffMs = due - now
    const mins = Math.max(0, Math.round(Math.abs(diffMs) / 60_000))
    if (diffMs >= 0) return { label: `${mins}m left`, overdue: false }
    return { label: `${mins}m overdue`, overdue: true }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Loading handoffs…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Handoffs
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Escalations created by the agent (ESCALATE_TO_HUMAN).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950">
              <div className="text-slate-500 dark:text-slate-400">Open</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {counts.open}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950">
              <div className="text-slate-500 dark:text-slate-400">Resolved</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {counts.resolved}
              </div>
            </div>
          </div>
        </div>

        {handoffs.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            No handoffs yet. Ask the agent something it can’t do (or request a
            human) to test escalation.
          </div>
        ) : (
          <div className="space-y-3">
            {handoffs.map((h) => (
              <div
                key={h.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Handoff #{h.id}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(h.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      void tick
                      const sla = formatSla(h.due_at)
                      if (!sla || h.status === 'resolved') return null
                      return (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            sla.overdue
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                              : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200'
                          }`}
                        >
                          SLA: {sla.label}
                        </span>
                      )
                    })()}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        h.status === 'open'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                      }`}
                    >
                      {h.status}
                    </span>
                    <select
                      value={h.status}
                      onChange={(e) =>
                        updateHandoff(h.id, {
                          status: e.target.value as Handoff['status'],
                        })
                      }
                      disabled={updatingId === h.id}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="open">open</option>
                      <option value="resolved">resolved</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Reason
                    </div>
                    <div className="mt-2 whitespace-pre-line">
                      {h.reason || '(no reason provided)'}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Ops
                      </div>
                      <button
                        onClick={async () => {
                          const message = [
                            `Handoff #${h.id} needs attention`,
                            `Status: ${h.status}`,
                            h.due_at ? `Due: ${new Date(h.due_at).toLocaleString()}` : null,
                            h.assigned_to ? `Assigned: ${h.assigned_to}` : null,
                            h.reason ? `Reason: ${h.reason}` : null,
                          ]
                            .filter(Boolean)
                            .join('\n')
                          try {
                            await navigator.clipboard.writeText(message)
                            setCopiedId(h.id)
                            window.setTimeout(() => setCopiedId(null), 1200)
                          } catch {
                            // ignore
                          }
                        }}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        {copiedId === h.id ? 'Copied' : 'Notify'}
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3">
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Assigned to
                        </span>
                        <input
                          defaultValue={h.assigned_to || ''}
                          onBlur={(e) => {
                            const v = e.target.value.trim()
                            const next = v ? v : null
                            if ((h.assigned_to || null) !== next) {
                              updateHandoff(h.id, { assigned_to: next })
                            }
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          placeholder="e.g. Front desk"
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            updateHandoff(h.id, {
                              due_at: new Date(Date.now() + 10 * 60_000).toISOString(),
                            })
                          }
                          disabled={updatingId === h.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          SLA 10m
                        </button>
                        <button
                          onClick={() =>
                            updateHandoff(h.id, {
                              due_at: new Date(Date.now() + 30 * 60_000).toISOString(),
                            })
                          }
                          disabled={updatingId === h.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          SLA 30m
                        </button>
                        <button
                          onClick={() => updateHandoff(h.id, { due_at: '' })}
                          disabled={updatingId === h.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          Clear SLA
                        </button>
                      </div>

                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Resolution notes
                        </span>
                        <textarea
                          defaultValue={h.resolution_notes || ''}
                          onBlur={(e) => {
                            const v = e.target.value.trim()
                            const next = v ? v : null
                            if ((h.resolution_notes || null) !== next) {
                              updateHandoff(h.id, { resolution_notes: next })
                            }
                          }}
                          rows={3}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          placeholder="Resolution, next steps, follow-ups…"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
