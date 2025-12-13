'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ServiceCatalog from '@/components/ServiceCatalog'
import { useTenant } from '@/hooks/useTenant'
import { api, BusinessProfile } from '@/utils/api'

export default function ServicesPage() {
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
        console.error('Failed to load services profile', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [tenantId, mounted, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-300">Loading services…</p>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                  Services catalog
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  A clear catalogue your AI agent can recommend, quote, and book for{' '}
                  <span className="font-medium">{profile.name}</span>.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/agent-preview"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  View storefront preview
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Edit services
                </Link>
              </div>
            </div>
          </div>
        </div>

        {profile.services && profile.services.length > 0 ? (
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8">
            <ServiceCatalog
              services={profile.services}
              currency={profile.payments?.currency}
              title="Your services"
              subtitle="Search, scan, and confirm the images look sharp — this is what customers will recognize."
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-8">
            <div className="text-slate-900 dark:text-white text-lg font-semibold">
              No services yet
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              Add 3–8 “signature services” with photos and clear names. It makes the agent
              feel smarter, and your storefront instantly more credible.
            </p>
            <div className="mt-5">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Add services now
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

