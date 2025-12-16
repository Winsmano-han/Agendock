'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ChatPlayground from '@/components/ChatPlayground'
import { useTenant } from '@/hooks/useTenant'
import { api, BusinessProfile } from '@/utils/api'

interface Stats {
  messages_today: number
  conversations_today?: number
  unread_conversations?: number
  total_appointments: number
  total_complaints: number
  most_requested_service_name: string | null
  most_requested_service_count: number
}

type Faq = { question: string; answer: string }
type CoachInsight = { title: string; body: string }

export default function DashboardPage() {
  const { tenantId, mounted } = useTenant()
  const router = useRouter()

  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showChat, setShowChat] = useState(false)
  const [whatsAppCopied, setWhatsAppCopied] = useState(false)
  const [startLinkCopied, setStartLinkCopied] = useState(false)
  const [businessIdCopied, setBusinessIdCopied] = useState(false)
  const [resetting, setResetting] = useState(false)

  const [knowledgeText, setKnowledgeText] = useState('')
  const [knowledgeLoading, setKnowledgeLoading] = useState(true)
  const [knowledgeSaving, setKnowledgeSaving] = useState(false)
  const [knowledgeSavedAt, setKnowledgeSavedAt] = useState<string | null>(null)
  const [knowledgeUploading, setKnowledgeUploading] = useState(false)
  const [knowledgeUploadNote, setKnowledgeUploadNote] = useState<string | null>(null)

  const [faqLoading, setFaqLoading] = useState(false)
  const [faqSuggestions, setFaqSuggestions] = useState<Faq[]>([])
  const [faqNotes, setFaqNotes] = useState<string[]>([])

  const [coachLoading, setCoachLoading] = useState(false)
  const [coachInsights, setCoachInsights] = useState<CoachInsight[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    if (!mounted) return
    if (!tenantId) {
      router.replace('/login')
      return
    }

    const load = async () => {
      try {
        setError(null)
        const [profileData, statsData, knowledgeData] = await Promise.all([
          api.getBusinessProfile(tenantId),
          api.getStats(tenantId),
          api.getKnowledge(tenantId),
        ])
        setProfile(profileData)
        setStats(statsData)
        setKnowledgeText(
          knowledgeData && typeof knowledgeData.raw_text === 'string'
            ? knowledgeData.raw_text
            : '',
        )
      } catch (err) {
        console.error('Failed to load dashboard data', err)
        setError('Unable to load dashboard data. Please refresh the page or try again later.')
      } finally {
        setLoading(false)
        setKnowledgeLoading(false)
      }
    }

    load()
    
    // Auto-refresh stats every 30 seconds
    const interval = setInterval(async () => {
      if (tenantId) {
        try {
          const freshStats = await api.getStats(tenantId)
          setStats(freshStats)
          setLastRefresh(new Date())
        } catch (err) {
          console.error('Failed to refresh stats', err)
        }
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [tenantId, mounted, router])

  const openingHoursEntries = useMemo(
    () => (profile?.opening_hours ? Object.entries(profile.opening_hours) : []),
    [profile],
  )

  const sandboxJoinLink =
    'https://wa.me/14155238886?text=join%20human-room'
  const businessCode = profile?.business_code
  const startLink =
    businessCode != null
      ? `https://wa.me/14155238886?text=START-${businessCode}`
      : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            Loading dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (!profile || !profile.name) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Complete your setup
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Finish your business profile so your agent can answer questions and
            take bookings/orders.
          </p>
          <Link
            href="/onboarding"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Complete profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-sm border border-white/10">
          {profile.cover_image_url && (
            <img
              src={profile.cover_image_url}
              alt="Cover"
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />

          <div className="relative px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8 flex flex-col lg:flex-row items-start lg:items-center gap-4 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.name}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border-2 border-white shadow-xl"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold shadow-xl border border-white/10">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  {profile.name}
                </h1>
                <p className="mt-1 text-sm sm:text-base text-blue-100">
                  {profile.business_type}
                  {profile.location ? ` · ${profile.location}` : ''}
                </p>
                {profile.tagline && (
                  <p className="mt-2 text-sm sm:text-base text-blue-50 italic">
                    {profile.tagline}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full lg:ml-auto lg:w-[26rem] flex flex-col items-stretch gap-3">
              <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-xs text-blue-50 backdrop-blur-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-blue-50">
                    Live agent snapshot
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500/20 text-[10px] text-green-100 border border-green-400/50">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 mb-1 leading-relaxed">
                  What your agent uses from this profile when chatting.
                </p>
                <p className="mb-1">
                  <span className="font-medium">Hours:</span>{' '}
                  {openingHoursEntries.length > 0
                    ? openingHoursEntries
                        .slice(0, 2)
                        .map(
                          ([day, hours]) =>
                            `${day[0].toUpperCase()}${day.slice(1)}: ${
                              hours || 'Closed'
                            }`,
                        )
                        .join(' • ')
                    : 'Not set'}
                </p>
                {profile.services && profile.services.length > 0 && (
                  <p className="mb-1">
                    <span className="font-medium">Top services:</span>{' '}
                    {profile.services
                      .slice(0, 3)
                      .map((s) => s.name)
                      .join(', ')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => router.push('/agent-preview')}
                  className="mt-2 inline-flex text-[11px] text-blue-50 hover:text-white underline-offset-2 hover:underline"
                >
                  View full agent preview
                </button>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  Edit profile
                </Link>
                <Link
                  href="/ai-features"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                  🤖 AI Features
                </Link>
                <button
                  type="button"
                  onClick={() => setShowChat(true)}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-emerald-300 text-emerald-950 hover:bg-emerald-200 transition-colors"
                >
                  Test AI chat
                </button>
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/ai-features"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-300/30 px-3 py-2 text-xs font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-colors"
              >
                🤖 AI Features
              </Link>
              <button
                type="button"
                onClick={async () => {
                  if (!tenantId) return
                  if (
                    !window.confirm(
                      'Reset this demo? This clears chats, appointments, customers, and cached AI replies for this business.',
                    )
                  )
                    return
                  setResetting(true)
                  try {
                    await api.resetTenant(tenantId, { wipe_profile: false })
                    window.location.reload()
                  } catch (err) {
                    console.error('Failed to reset tenant', err)
                  } finally {
                    setResetting(false)
                  }
                }}
                disabled={resetting}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 text-xs font-medium"
              >
                {resetting ? 'Resetting…' : 'Reset demo'}
              </button>
              <Link
                href="/chats"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 text-xs font-medium"
              >
                View conversations
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Business info
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Quick details your agent uses for context and routing.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/agent-preview"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    Storefront
                  </Link>
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    Catalogue
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {profile.location && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                    <div className="text-slate-500 dark:text-slate-400">
                      Location
                    </div>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {profile.location}
                    </p>
                  </div>
                )}
                {profile.contact_phone && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                    <div className="text-slate-500 dark:text-slate-400">
                      Phone
                    </div>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {profile.contact_phone}
                    </p>
                  </div>
                )}
                {profile.whatsapp_number && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                    <div className="text-slate-500 dark:text-slate-400">
                      WhatsApp
                    </div>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {profile.whatsapp_number}
                    </p>
                  </div>
                )}
                {profile.time_zone && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                    <div className="text-slate-500 dark:text-slate-400">
                      Time zone
                    </div>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {profile.time_zone}
                    </p>
                  </div>
                )}

                {businessCode && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-slate-500 dark:text-slate-400">
                        Business ID
                      </div>
                      <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-white truncate">
                        {businessCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(businessCode)
                          setBusinessIdCopied(true)
                          setTimeout(() => setBusinessIdCopied(false), 1500)
                        } catch {
                          setBusinessIdCopied(false)
                        }
                      }}
                      className="shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {businessIdCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Opening hours
              </h2>
              {openingHoursEntries.length === 0 ? (
                <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm">
                  No hours configured yet.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {openingHoursEntries.map(([day, hours]) => (
                    <div
                      key={day}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2"
                    >
                      <span className="capitalize text-slate-700 dark:text-slate-200 font-medium">
                        {day}
                      </span>
                      <span className="text-slate-900 dark:text-slate-100">
                        {hours && hours.trim() ? hours : 'Closed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Quick stats
                </h2>
                <Link
                  href="/chats"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  View chats
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/chats"
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Chats today
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {stats?.conversations_today ?? stats?.messages_today ?? 0}
                    </div>
                    {(stats?.unread_conversations || 0) > 0 && (
                      <span className="inline-flex items-center rounded-full bg-blue-600 text-white px-2 py-0.5 text-[10px] font-semibold">
                        {stats?.unread_conversations} unread
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Open conversations →
                  </div>
                </Link>

                <Link
                  href="/bookings"
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Appointments
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                    {stats?.total_appointments ?? 0}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    View bookings →
                  </div>
                </Link>

                <Link
                  href="/complaints"
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Complaints
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                    {stats?.total_complaints ?? 0}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Manage issues →
                  </div>
                </Link>

                <Link
                  href="/orders"
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Orders
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                    0
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    View orders →
                  </div>
                </Link>
              </div>

              {stats?.most_requested_service_name && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm">
                  <div className="text-slate-600 dark:text-slate-300">
                    Top service
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-right">
                    {stats.most_requested_service_name}{' '}
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      ({stats.most_requested_service_count})
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                WhatsApp links
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Copy these links into your Instagram bio, website, or Google business profile.
              </p>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        Step 1 — join the sandbox (once)
                      </div>
                      <div className="mt-2 font-mono text-xs text-slate-700 dark:text-slate-200 break-all">
                        {sandboxJoinLink}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(sandboxJoinLink)
                          setWhatsAppCopied(true)
                          setTimeout(() => setWhatsAppCopied(false), 1500)
                        } catch {
                          setWhatsAppCopied(false)
                        }
                      }}
                      className="shrink-0 inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      {whatsAppCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {businessCode && startLink && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          Step 2 — send customers to your business agent
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <span>Business ID:</span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">
                            {businessCode}
                          </span>
                        </div>
                        <div className="mt-2 font-mono text-xs text-slate-700 dark:text-slate-200 break-all">
                          {startLink}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(startLink)
                            setStartLinkCopied(true)
                            setTimeout(() => setStartLinkCopied(false), 1500)
                          } catch {
                            setStartLinkCopied(false)
                          }
                        }}
                        className="shrink-0 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        {startLinkCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Business knowledge</h2>
                {knowledgeSavedAt && (
                  <span className="text-[11px] text-gray-400">
                    Saved at {knowledgeSavedAt}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Paste extra info for your agent: menus, products, FAQs, delivery
                details, and policies.
              </p>
              <div className="mb-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                    Upload a PDF/DOCX/TXT (RAG + citations)
                  </label>
                  {knowledgeUploadNote && (
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {knowledgeUploadNote}
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  disabled={knowledgeUploading}
                  onChange={async (e) => {
                    if (!tenantId) return
                    const file = e.target.files?.[0]
                    if (!file) return
                    setKnowledgeUploadNote(null)
                    setKnowledgeUploading(true)
                    try {
                      const res = await api.uploadKnowledgeFile(tenantId, file, { append: true })
                      if (res && res.status === 'ok') {
                        setKnowledgeUploadNote(`Imported ${file.name}`)
                        const refreshed = await api.getKnowledge(tenantId)
                        setKnowledgeText(
                          refreshed && typeof refreshed.raw_text === 'string'
                            ? refreshed.raw_text
                            : '',
                        )
                      } else {
                        setKnowledgeUploadNote(res?.error ? String(res.error) : 'Upload failed')
                      }
                    } catch (err) {
                      console.error('Knowledge upload failed', err)
                      setKnowledgeUploadNote('Upload failed')
                    } finally {
                      setKnowledgeUploading(false)
                      e.target.value = ''
                    }
                  }}
                  className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700 text-gray-600 dark:text-gray-300"
                />
              </div>
              <textarea
                value={knowledgeText}
                onChange={(e) => setKnowledgeText(e.target.value)}
                rows={6}
                disabled={knowledgeLoading}
                className="w-full text-sm rounded-md border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  Keep it concise — a few pages of text is ideal.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!tenantId) return
                      setKnowledgeSaving(true)
                      try {
                        await api.updateKnowledge(tenantId, knowledgeText)
                        setKnowledgeSavedAt(
                          new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                        )
                      } catch (err) {
                        console.error('Failed to save knowledge text', err)
                      } finally {
                        setKnowledgeSaving(false)
                      }
                    }}
                    disabled={knowledgeLoading || knowledgeSaving}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {knowledgeSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!tenantId) return
                      setFaqLoading(true)
                      try {
                        const data = await api.getFaqSuggestions(tenantId)
                        setFaqSuggestions(
                          Array.isArray(data.faqs) ? data.faqs : [],
                        )
                        setFaqNotes(Array.isArray(data.notes) ? data.notes : [])
                      } catch (err) {
                        console.error('Failed to load FAQ suggestions', err)
                        setFaqSuggestions([])
                        setFaqNotes([])
                      } finally {
                        setFaqLoading(false)
                      }
                    }}
                    disabled={faqLoading}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-60"
                  >
                    {faqLoading ? 'Analyzing...' : 'AI FAQs'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!tenantId) return
                      setCoachLoading(true)
                      try {
                        const data = await api.getCoachingInsights(tenantId)
                        const raw = Array.isArray(data.insights)
                          ? data.insights
                          : []
                        setCoachInsights(
                          raw
                            .map((i: any) => ({
                              title: String(i.title ?? '').trim(),
                              body: String(i.body ?? '').trim(),
                            }))
                            .filter((i: CoachInsight) => i.title && i.body),
                        )
                      } catch (err) {
                        console.error('Failed to load coaching insights', err)
                        setCoachInsights([])
                      } finally {
                        setCoachLoading(false)
                      }
                    }}
                    disabled={coachLoading}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 dark:border-slate-700 text-amber-600 dark:text-amber-300 hover:bg-amber-50/70 dark:hover:bg-amber-500/10 disabled:opacity-60"
                  >
                    {coachLoading ? 'Coaching...' : 'AI coach'}
                  </button>
                </div>
              </div>

              {faqSuggestions.length > 0 && (
                <div className="mt-4 border-t border-dashed border-gray-200 dark:border-slate-700 pt-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    Suggested FAQs
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                    {faqSuggestions.map((f, idx) => (
                      <li
                        key={idx}
                        className="border border-gray-100 dark:border-slate-800 rounded-md px-2 py-1.5"
                      >
                        <p className="font-medium">Q: {f.question}</p>
                        <p className="mt-0.5">A: {f.answer}</p>
                      </li>
                    ))}
                  </ul>
                  {faqNotes.length > 0 && (
                    <div className="mt-3 text-[11px] text-gray-400">
                      <p className="font-medium mb-1">Notes:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {faqNotes.map((n, idx) => (
                          <li key={idx}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {coachInsights.length > 0 && (
                <div className="mt-4 border-t border-dashed border-gray-200 dark:border-slate-700 pt-3">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    AgentDock Coach
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                    {coachInsights.map((c, idx) => (
                      <li
                        key={idx}
                        className="border border-gray-100 dark:border-slate-800 rounded-md px-2 py-1.5"
                      >
                        <p className="font-semibold mb-0.5">{c.title}</p>
                        <p>{c.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showChat && tenantId && (
        <ChatPlayground tenantId={tenantId} onClose={() => setShowChat(false)} />
      )}
    </div>
  )
}
