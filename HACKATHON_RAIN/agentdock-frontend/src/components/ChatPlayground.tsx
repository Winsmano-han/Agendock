'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/utils/api'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

interface ChatPlaygroundProps {
  tenantId: number
  onClose: () => void
}

export default function ChatPlayground({ tenantId, onClose }: ChatPlaygroundProps) {
  const storageKey = `agentdock_chat_${tenantId}`
  const customerKey = `agentdock_web_customer_${tenantId}`
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      let customerPhone = ''
      try {
        const existing = localStorage.getItem(customerKey)
        if (existing) {
          customerPhone = existing
        } else {
          customerPhone = `web:${crypto.randomUUID()}`
          localStorage.setItem(customerKey, customerPhone)
        }
      } catch {
        customerPhone = `web:${Date.now()}`
      }

      const response = await api.demoChat({
        tenant_id: tenantId,
        message: inputMessage,
        customer_name: 'Web visitor',
        customer_phone: customerPhone,
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.reply,
        sender: 'ai',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't reach the AI right now. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as {
          id: string
          text: string
          sender: 'user' | 'ai'
          timestamp: string
        }[]
        const hydrated: Message[] = parsed.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
        setMessages(hydrated)
      }
    } catch {
      // ignore malformed local storage
    }
  }, [storageKey])

  useEffect(() => {
    try {
      const toStore = messages.map((m) => ({
        id: m.id,
        text: m.text,
        sender: m.sender,
        timestamp: m.timestamp.toISOString(),
      }))
      localStorage.setItem(storageKey, JSON.stringify(toStore))
    } catch {
      // ignore localStorage errors
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, storageKey])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-[min(44rem,calc(100vw-1.5rem))] h-[min(40rem,calc(100vh-2.5rem))] sm:h-[36rem] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Test your AI agent
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Messages here use the same brain as WhatsApp, but stay private.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                'What services do you offer?',
                'What are your opening hours?',
                'Book an appointment tomorrow at 3pm',
                'What is your refund policy?',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setInputMessage(q)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            X
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-3 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-slate-950 dark:to-slate-900 space-y-3"
        >
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-slate-400 text-sm px-4">
                Start a conversation with your AI agent. Try asking about
                services, opening hours, or booking an appointment.
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.sender === 'user'
            const timeLabel = message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-xs flex flex-col">
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm dark:bg-slate-800 dark:text-slate-50 dark:border-slate-700'
                    }`}
                  >
                    <p>{message.text}</p>
                  </div>
                  <span
                    className={`mt-1 text-[11px] text-gray-500 dark:text-slate-400 ${
                      isUser ? 'text-right' : 'text-left'
                    }`}
                  >
                    {isUser ? 'You' : 'Agent'} - {timeLabel}
                  </span>
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-3 py-2 rounded-2xl shadow-sm dark:bg-slate-800 dark:border-slate-700">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-gray-400 dark:bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 dark:bg-slate-400 rounded-full animate-bounce delay-150" />
                  <span className="w-2 h-2 bg-gray-400 dark:bg-slate-400 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-t border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message to your agent."
              className="flex-1 text-sm border border-gray-300 dark:border-slate-700 rounded-full px-3 py-2 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-50 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-800"
              disabled={loading}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim()}
              className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
