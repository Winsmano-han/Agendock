'use client'

import { useEffect, useMemo, useState } from 'react'
import { api, BusinessProfile } from '@/utils/api'

type HelperMessage = { from: 'assistant' | 'user'; text: string; meta?: string }

type Props = {
  open: boolean
  onClose: () => void
  tenantId: number
  profile: BusinessProfile
  onProfilePatch: (patch: Partial<BusinessProfile>) => void
  onStepHint?: (hint: string) => void
}

function summarizePatch(patch: Partial<BusinessProfile>): string[] {
  const keys = Object.keys(patch || {})
  const out: string[] = []
  for (const k of keys) {
    if (k === 'opening_hours') out.push('Opening hours')
    else if (k === 'services') out.push('Services')
    else if (k === 'booking_rules') out.push('Booking rules')
    else if (k === 'voice_and_language') out.push('Brand voice')
    else if (k === 'refunds') out.push('Refunds')
    else if (k === 'payments') out.push('Payments')
    else out.push(k.split('_').join(' '))
  }
  return Array.from(new Set(out)).slice(0, 6)
}

export default function SetupAssistantDrawer({
  open,
  onClose,
  tenantId,
  profile,
  onProfilePatch,
  onStepHint,
}: Props) {
  const storageKey = useMemo(
    () => `agentdock_setup_assistant_${tenantId}`,
    [tenantId],
  )

  const [messages, setMessages] = useState<HelperMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setMessages(parsed)
      } else {
        setMessages([
          {
            from: 'assistant',
            text: `Hi — I'm your setup assistant. Paste your menu/price list, policies, or describe your business, and I’ll fill the profile.`,
          },
          {
            from: 'assistant',
            text: `Tip: you can paste a full document (services, opening hours, rules) in one message.`,
          },
        ])
      }
    } catch {
      // ignore
    }
  }, [open, storageKey])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    } catch {
      // ignore
    }
  }, [messages, storageKey])

  const send = async () => {
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')
    setMessages((prev) => [...prev, { from: 'user', text: content }])

    try {
      const res = await api.setupAssistant({
        tenant_id: tenantId,
        message: content,
        business_profile: profile,
        history: messages.concat({ from: 'user', text: content }),
      })

      const reply: string =
        res?.assistant_reply || `Got it. What else should I add?`
      const patch = (res?.profile_patch || {}) as Partial<BusinessProfile>
      const stepHint: string = res?.step_hint || 'none'
      const updated = summarizePatch(patch)

      if (patch && Object.keys(patch).length > 0) {
        onProfilePatch(patch)
      }
      if (onStepHint) onStepHint(stepHint)

      setMessages((prev) => [
        ...prev,
        {
          from: 'assistant',
          text: reply,
          meta: updated.length ? `Updated: ${updated.join(', ')}` : undefined,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          from: 'assistant',
          text: `I couldn’t reach the AI helper right now. Try again in a moment, or continue editing manually.`,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[28rem] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              Setup Assistant
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Paste docs or answer questions — I’ll update your profile live.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!confirm('Clear assistant chat history?')) return
                setMessages([])
                try {
                  localStorage.removeItem(storageKey)
                } catch {
                  // ignore
                }
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%]">
                <div
                  className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    m.from === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-50'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>
                </div>
                {m.meta && (
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {m.meta}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Thinking…
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={3}
              placeholder="Paste your business info… (Ctrl+Enter to send)"
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !input.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
