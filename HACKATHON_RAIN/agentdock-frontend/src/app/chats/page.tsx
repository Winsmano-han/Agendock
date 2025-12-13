'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/utils/api'
import { useTenant } from '@/hooks/useTenant'

type Message = {
  id: number
  tenant_id: number
  customer_id: number | null
  direction: 'in' | 'out'
  text: string
  created_at: string
}

type Conversation = {
  conversation_key: string
  customer_id: number | null
  customer_name: string
  customer_phone: string | null
  state_mode?: string
  last_message: string
  last_direction: 'in' | 'out'
  last_at: string
}

type Sentiment = 'positive' | 'neutral' | 'negative'

export default function ChatsPage() {
  const { tenantId, mounted } = useTenant()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [clearing, setClearing] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [summarySentiment, setSummarySentiment] =
    useState<Sentiment>('neutral')
  const [summaryNextSteps, setSummaryNextSteps] = useState<string | null>(null)

  const normalizeMessages = (msgs: unknown) => {
    const arr: Message[] = Array.isArray(msgs) ? (msgs as Message[]) : []
    return [...arr].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
  }

  useEffect(() => {
    if (!mounted) return
    if (!tenantId) {
      router.replace('/login')
      return
    }

    const load = async () => {
      try {
        const convoData = await api.listConversations(tenantId)
        const convos: Conversation[] = Array.isArray(convoData)
          ? convoData
          : []
        setConversations(convos)

        if (convos.length > 0) {
          const first = convos[0]
          setActiveConversation(first)
          const msgs = await api.getMessages(tenantId, first.customer_id)
          setMessages(normalizeMessages(msgs))

          if (first.customer_id != null) {
            await loadSummary(tenantId, first.customer_id)
          }
        } else {
          resetSummary()
        }
      } catch (err) {
        console.error('Failed to load conversations', err)
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, mounted, router])

  useEffect(() => {
    if (!mounted || !tenantId) return

    let stopped = false
    const refresh = async () => {
      if (stopped) return
      if (typeof document !== 'undefined' && document.hidden) return
      try {
        const convoData = await api.listConversations(tenantId)
        const convos: Conversation[] = Array.isArray(convoData)
          ? convoData
          : []
        setConversations(convos)

        if (activeConversation?.customer_id != null) {
          const msgs = await api.getMessages(
            tenantId,
            activeConversation.customer_id,
          )
          setMessages(normalizeMessages(msgs))
        }
      } catch {
        // silent polling errors
      }
    }

    // Prefer SSE for realtime feel; keep a light polling fallback.
    const token =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('auth_token')
        : null
    const url = `${location.protocol}//${location.hostname}:5000/tenants/${tenantId}/events${
      token ? `?token=${encodeURIComponent(token)}` : ''
    }`

    let es: EventSource | null = null
    try {
      es = new EventSource(url)
      es.addEventListener('tenant_event', () => refresh())
    } catch {
      // ignore SSE errors
    }

    const interval = window.setInterval(refresh, 8000)
    return () => {
      stopped = true
      window.clearInterval(interval)
      try {
        es?.close()
      } catch {
        // ignore
      }
    }
  }, [tenantId, mounted, activeConversation])

  const resetSummary = () => {
    setSummary(null)
    setSummaryNextSteps(null)
    setSummarySentiment('neutral')
  }

  const loadSummary = async (tenantId: number, customerId: number) => {
    try {
      setSummaryLoading(true)
      const data = await api.getConversationSummary(tenantId, customerId)
      if (data) {
        setSummary((data.summary as string) || null)
        const rawSentiment = (data.sentiment as string) || ''
        if (
          rawSentiment === 'positive' ||
          rawSentiment === 'neutral' ||
          rawSentiment === 'negative'
        ) {
          setSummarySentiment(rawSentiment)
        } else {
          setSummarySentiment('neutral')
        }
        setSummaryNextSteps((data.next_steps as string) || null)
      }
    } catch (err) {
      console.error('Failed to load conversation summary', err)
      resetSummary()
    } finally {
      setSummaryLoading(false)
    }
  }

  const loadMessagesForConversation = async (convo: Conversation) => {
    if (!tenantId) return
    try {
      const msgs = await api.getMessages(tenantId, convo.customer_id)
      setMessages(normalizeMessages(msgs))
      setActiveConversation(convo)

      if (convo.customer_id != null) {
        await loadSummary(tenantId, convo.customer_id)
      } else {
        resetSummary()
      }
    } catch (err) {
      console.error('Failed to load messages for conversation', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this message from history?')) return
    setDeletingId(id)
    try {
      await api.deleteMessage(id)
      setMessages((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      console.error('Failed to delete message', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleClearAll = async () => {
    if (!tenantId) return
    if (!window.confirm('Clear all chat messages for this business?')) return
    setClearing(true)
    try {
      await api.clearMessages(tenantId)
      setMessages([])
      setConversations([])
      setActiveConversation(null)
      resetSummary()
    } catch (err) {
      console.error('Failed to clear messages', err)
    } finally {
      setClearing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">
          Loading conversations…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Conversations
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Recent WhatsApp and web chats grouped by customer. Select a
              conversation to see the full thread and a quick AI summary.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearing || conversations.length === 0}
            className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {clearing ? 'Clearing…' : 'Clear all'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm h-[32rem] flex overflow-hidden">
          {/* Left: conversation list */}
          <div className="w-64 border-r border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex flex-col">
            {conversations.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 px-3 text-center">
                No conversations yet. Try chatting with your agent from the
                dashboard.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {conversations.map((convo) => {
                  const isActive =
                    activeConversation?.conversation_key ===
                    convo.conversation_key
                  const lastTime = new Date(convo.last_at).toLocaleTimeString(
                    [],
                    { hour: '2-digit', minute: '2-digit' },
                  )
                  return (
                    <button
                      key={convo.conversation_key}
                      type="button"
                      onClick={() => loadMessagesForConversation(convo)}
                      className={`w-full text-left px-3 py-2 border-b border-gray-100 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs ${
                        isActive ? 'bg-white dark:bg-slate-900' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {convo.customer_name}
                          </span>
                          {convo.state_mode &&
                            convo.state_mode !== 'idle' &&
                            convo.state_mode !== 'unknown' && (
                              <span className="shrink-0 inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-2 py-0.5 text-[10px] font-medium">
                                {convo.state_mode.split('_').join(' ')}
                              </span>
                            )}
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {lastTime}
                        </span>
                      </div>
                      {convo.customer_phone && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {convo.customer_phone}
                        </div>
                      )}
                      <div className="text-[11px] text-gray-600 dark:text-gray-300 truncate mt-0.5">
                        {convo.last_direction === 'in' ? 'Customer: ' : 'Agent: '}
                        {convo.last_message}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: message thread */}
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950">
            {!activeConversation || messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-600 dark:text-gray-300 px-4 text-center">
                {conversations.length === 0
                  ? 'No messages yet.'
                  : 'Select a conversation on the left to see the full thread.'}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* AI summary card */}
                <div className="mb-3 rounded-lg border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Conversation summary
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          summarySentiment === 'positive'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : summarySentiment === 'negative'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-200'
                        }`}
                      >
                        {summarySentiment === 'positive'
                          ? 'Positive'
                          : summarySentiment === 'negative'
                          ? 'Needs attention'
                          : 'Neutral'}
                      </span>
                    </div>
                    <p className="whitespace-pre-line">
                      {summaryLoading
                        ? 'Summarizing this conversation…'
                        : summary ||
                          'Select a conversation to see a quick summary for the business owner.'}
                    </p>
                    {summaryNextSteps && (
                      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Next steps:</span>{' '}
                        {summaryNextSteps}
                      </p>
                    )}
                  </div>
                  {activeConversation.customer_id != null && (
                    <button
                      type="button"
                      onClick={() =>
                        loadMessagesForConversation(activeConversation)
                      }
                      disabled={summaryLoading}
                      className="ml-2 text-[11px] text-blue-600 hover:text-blue-700 disabled:opacity-60"
                    >
                      Refresh
                    </button>
                  )}
                </div>

                {messages.map((m) => {
                  const dt = new Date(m.created_at)
                  const timeLabel = dt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const isUser = m.direction === 'in'

                  return (
                    <div
                      key={m.id}
                      className={`flex ${
                        isUser ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div className="max-w-xl flex flex-col">
                        <div
                          className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                            isUser
                              ? 'bg-white text-gray-900 border border-gray-200 dark:bg-slate-800 dark:text-gray-50 dark:border-slate-700'
                              : 'bg-blue-600 text-white dark:bg-blue-500'
                          }`}
                        >
                          <p>{m.text}</p>
                        </div>
                        <div
                          className={`mt-1 text-[11px] text-gray-500 ${
                            isUser ? 'text-left' : 'text-right'
                          }`}
                        >
                          {isUser ? 'Customer' : 'Agent'} · {timeLabel}{' '}
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            disabled={deletingId === m.id}
                            className="ml-2 text-[11px] text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            {deletingId === m.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
