'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/hooks/useTenant'
import { api } from '@/utils/api'

type Order = {
  id: number
  tenant_id: number
  customer_id: number | null
  status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled'
  items: any[] | null
  total_amount: number | null
  assigned_to?: string | null
  due_at?: string | null
  resolution_notes?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at?: string
}

export default function OrdersPage() {
  const { tenantId, mounted } = useTenant()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
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
        const data = await api.getOrders(tenantId)
        setOrders(Array.isArray(data) ? data : [])
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenantId, mounted, router])

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000)
    return () => clearInterval(t)
  }, [])

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
        const data = await api.getOrders(tenantId)
        setOrders(Array.isArray(data) ? data : [])
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
          if (parsed?.type === 'order_created' || parsed?.type === 'order_updated') {
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

  const counts = useMemo(() => {
    const c = { pending: 0, confirmed: 0, fulfilled: 0, cancelled: 0 }
    for (const o of orders) c[o.status] = (c as any)[o.status] + 1
    return c
  }, [orders])

  const updateOrder = async (
    orderId: number,
    patch: {
      status?: Order['status']
      assigned_to?: string | null
      due_at?: string | null
      resolution_notes?: string | null
    },
  ) => {
    if (!tenantId) return
    setUpdatingId(orderId)
    try {
      const updated = (await api.updateOrder(orderId, patch)) as Partial<Order>
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? ({ ...o, ...updated } as Order) : o)),
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
          Loading orders…
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
              Orders
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Orders created by your agent&apos;s tool calls (CREATE_ORDER).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(counts).map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="text-slate-500 dark:text-slate-400 uppercase">
                  {k}
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            No orders yet. Try asking the agent to place an order (e.g. “I want
            2 small chops trays”).
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Order #{o.id}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      void tick
                      const sla = formatSla(o.due_at)
                      if (!sla || o.status === 'fulfilled' || o.status === 'cancelled')
                        return null
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
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {o.status}
                    </span>
                    <select
                      value={o.status}
                      onChange={(e) =>
                        updateOrder(o.id, {
                          status: e.target.value as Order['status'],
                        })
                      }
                      disabled={updatingId === o.id}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="fulfilled">fulfilled</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Items
                    </div>
                    <div className="mt-2 space-y-1">
                      {(o.items || []).length ? (
                        (o.items || []).map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-slate-900 dark:text-slate-100">
                              {it?.name || 'Item'}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              x{it?.qty || 1}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 dark:text-slate-400">
                          (no items payload)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Ops
                    </div>
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                          {o.total_amount != null ? o.total_amount : '-'}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          (Set prices in the service list for accurate totals.)
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const message = [
                            `Order #${o.id} needs attention`,
                            `Status: ${o.status}`,
                            o.due_at ? `Due: ${new Date(o.due_at).toLocaleString()}` : null,
                            o.assigned_to ? `Assigned: ${o.assigned_to}` : null,
                          ]
                            .filter(Boolean)
                            .join('\n')
                          try {
                            await navigator.clipboard.writeText(message)
                            setCopiedId(o.id)
                            window.setTimeout(() => setCopiedId(null), 1200)
                          } catch {
                            // ignore
                          }
                        }}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        {copiedId === o.id ? 'Copied' : 'Notify'}
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Assigned to
                        </span>
                        <input
                          defaultValue={o.assigned_to || ''}
                          onBlur={(e) => {
                            const v = e.target.value.trim()
                            const next = v ? v : null
                            if ((o.assigned_to || null) !== next) {
                              updateOrder(o.id, { assigned_to: next })
                            }
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          placeholder="e.g. Sarah (Ops)"
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            updateOrder(o.id, {
                              due_at: new Date(Date.now() + 30 * 60_000).toISOString(),
                            })
                          }
                          disabled={updatingId === o.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          SLA 30m
                        </button>
                        <button
                          onClick={() =>
                            updateOrder(o.id, {
                              due_at: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
                            })
                          }
                          disabled={updatingId === o.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          SLA 2h
                        </button>
                        <button
                          onClick={() => updateOrder(o.id, { due_at: '' })}
                          disabled={updatingId === o.id}
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
                          defaultValue={o.resolution_notes || ''}
                          onBlur={(e) => {
                            const v = e.target.value.trim()
                            const next = v ? v : null
                            if ((o.resolution_notes || null) !== next) {
                              updateOrder(o.id, { resolution_notes: next })
                            }
                          }}
                          rows={3}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          placeholder="What happened? Any follow-ups?"
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
