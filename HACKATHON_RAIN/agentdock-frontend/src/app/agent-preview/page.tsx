'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import ServiceCatalog from '@/components/ServiceCatalog'
import { useTenant } from '@/hooks/useTenant'
import { api, BusinessProfile } from '@/utils/api'

const DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function AgentPreviewPage() {
  const { tenantId, mounted } = useTenant()
  const router = useRouter()
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mounted) return
    if (!tenantId) {
      router.replace('/login')
      return
    }

    const load = async () => {
      try {
        const data = await api.getBusinessProfile(tenantId)
        setProfile(data)
      } catch (err) {
        console.error('Failed to load agent preview profile', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [tenantId, mounted, router])

  const openingHours = useMemo(() => {
    const hours = profile?.opening_hours || {}
    return DAY_ORDER.map((day) => [day, hours[day]] as const)
  }, [profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-300">Loading preview…</p>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="relative h-56 sm:h-72 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            {profile.cover_image_url && (
              <Image
                src={profile.cover_image_url}
                alt="Cover"
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          </div>

          <div className="relative px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="-mt-10 sm:-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                {profile.profile_image_url ? (
                  <Image
                    src={profile.profile_image_url}
                    alt={profile.name}
                    width={112}
                    height={112}
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl"
                  />
                ) : (
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white dark:border-slate-900 shadow-xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                    {profile.name}
                  </h1>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {profile.business_type && (
                      <span className="inline-flex items-center rounded-full bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/10 px-2.5 py-1 font-medium text-slate-800 dark:text-slate-100">
                        {profile.business_type}
                      </span>
                    )}
                    {profile.location && (
                      <span className="inline-flex items-center rounded-full bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/10 px-2.5 py-1 font-medium text-slate-800 dark:text-slate-100">
                        {profile.location}
                      </span>
                    )}
                    {profile.time_zone && (
                      <span className="inline-flex items-center rounded-full bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/10 px-2.5 py-1 font-medium text-slate-800 dark:text-slate-100">
                        {profile.time_zone}
                      </span>
                    )}
                  </div>
                  {profile.tagline && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                      {profile.tagline}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  View services
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Edit profile
                </Link>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              This is the “storefront preview” your AI agent learns from: services, hours, policies,
              and brand voice.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Business overview
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {profile.contact_phone && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                    <div className="text-slate-500 dark:text-slate-400">Phone</div>
                    <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                      {profile.contact_phone}
                    </div>
                  </div>
                )}
                {profile.whatsapp_number && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                    <div className="text-slate-500 dark:text-slate-400">WhatsApp</div>
                    <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                      {profile.whatsapp_number}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8">
              {profile.services && profile.services.length > 0 ? (
                <ServiceCatalog
                  services={profile.services}
                  currency={profile.payments?.currency}
                  title="Services catalogue"
                  subtitle="Photos, names, and pricing customers will browse."
                />
              ) : (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Services catalogue
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    No services configured yet. Add services in the profile setup so the agent can recommend and book them.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/onboarding"
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                      Add services
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Opening hours
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                {openingHours.map(([day, hours]) => (
                  <div
                    key={day}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {titleCase(day)}
                    </span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {hours && hours.trim() ? hours : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Booking & policies
              </h2>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                {profile.booking_rules?.booking_types && (
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Booking types</div>
                    <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                      {profile.booking_rules.booking_types.join(', ')}
                    </div>
                  </div>
                )}
                {profile.payments?.methods && (
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Payment methods</div>
                    <div className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                      {profile.payments.methods.join(', ')}
                    </div>
                  </div>
                )}
                {profile.refunds?.refund_policy && (
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Refund policy</div>
                    <div className="mt-1">{profile.refunds.refund_policy}</div>
                  </div>
                )}
                {!profile.booking_rules && !profile.payments && !profile.refunds && (
                  <div className="text-slate-600 dark:text-slate-300">
                    Add booking rules, payments, and refund policy to make the agent’s answers consistent.
                  </div>
                )}
              </div>
            </div>

            {profile.voice_and_language && (
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Brand voice
                </h2>
                <div className="mt-4 space-y-3 text-sm">
                  {profile.voice_and_language.tone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Tone</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                        {profile.voice_and_language.tone}
                      </span>
                    </div>
                  )}
                  {profile.voice_and_language.languages && (
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Languages</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.voice_and_language.languages.map((lang) => (
                          <span
                            key={lang}
                            className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-200 px-2.5 py-1 text-xs font-medium"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

