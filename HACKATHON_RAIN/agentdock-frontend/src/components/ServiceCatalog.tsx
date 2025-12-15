'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import type { BusinessProfile } from '@/utils/api'

type Service = BusinessProfile['services'][number]

function formatPrice(price: number | undefined, currency: string | undefined) {
  if (price == null) return null
  if (price === 0) return 'Free'

  const currencyCode = (currency || 'NGN').toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(price)
  } catch {
    const symbol = currencyCode === 'NGN' ? '₦' : `${currencyCode} `
    return `${symbol}${price.toLocaleString()}`
  }
}

function ServiceImage({
  service,
  fallbackLabel,
}: {
  service: Service
  fallbackLabel: string
}) {
  if (service.image_url) {
    return (
      <Image
        src={service.image_url}
        alt={service.name}
        fill
        className="object-cover"
      />
    )
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
      <div className="h-14 w-14 rounded-2xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10 flex items-center justify-center">
        <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          {fallbackLabel}
        </span>
      </div>
    </div>
  )
}

export default function ServiceCatalog({
  services,
  currency,
  title,
  subtitle,
  compact = false,
}: {
  services: Service[]
  currency?: string
  title?: string
  subtitle?: string
  compact?: boolean
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return services

    return services.filter((service) => {
      const blob = [
        service.name,
        service.description,
        service.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [query, services])

  return (
    <div className="space-y-4">
      {(title || subtitle) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {subtitle}
              </p>
            )}
          </div>
          <div className="w-full sm:w-72">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services…"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">
                {filtered.length}/{services.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            No services match “{query.trim()}”.
          </div>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div
          className={[
            'grid gap-4',
            compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          ].join(' ')}
        >
          {filtered.map((service, index) => {
            const priceLabel = formatPrice(service.price, currency)
            const fallbackLabel = service.name
              .split(' ')
              .slice(0, 2)
              .map((part) => part.charAt(0).toUpperCase())
              .join('')
              .slice(0, 2)

            return (
              <div
                key={`${service.id ?? service.name}-${index}`}
                className="group overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-950 overflow-hidden">
                  <ServiceImage service={service} fallbackLabel={fallbackLabel} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {service.name}
                      </div>
                      {service.description && (
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300 overflow-hidden max-h-[3.2rem]">
                          {service.description}
                        </div>
                      )}
                    </div>
                    {priceLabel && (
                      <div className="shrink-0 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {priceLabel}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {service.category && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-200 px-2.5 py-1 text-xs font-medium">
                        {service.category}
                      </span>
                    )}
                    {service.duration_minutes != null && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1 text-xs font-medium">
                        {service.duration_minutes} min
                      </span>
                    )}
                    {priceLabel == null && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-200 px-2.5 py-1 text-xs font-medium">
                        Price not set
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

