'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import SetupAssistantDrawer from '@/components/SetupAssistantDrawer'
import { useTenant } from '@/hooks/useTenant'
import { api, BusinessProfile } from '@/utils/api'

type StepKey = 'basic' | 'hours' | 'services' | 'policies'

const steps: Array<{ key: StepKey; title: string; description: string }> = [
  { key: 'basic', title: 'Basics', description: 'Identity, contact, images.' },
  { key: 'hours', title: 'Hours', description: 'When you are open.' },
  { key: 'services', title: 'Services', description: 'Your menu / price list.' },
  { key: 'policies', title: 'Policies', description: 'Bookings & refunds.' },
]

const inputBase =
  'mt-0.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500'
const labelBase = 'text-xs font-semibold text-slate-700 dark:text-slate-200'

function mergeProfile(prev: BusinessProfile, patch: Partial<BusinessProfile>) {
  const next = {
    ...prev,
    ...patch,
    opening_hours: {
      ...(prev.opening_hours || {}),
      ...(patch.opening_hours || {}),
    },
    booking_rules: {
      ...(prev.booking_rules || {}),
      ...(patch.booking_rules || {}),
    },
    payments: { ...(prev.payments || {}), ...(patch.payments || {}) },
    refunds: { ...(prev.refunds || {}), ...(patch.refunds || {}) },
    voice_and_language: {
      ...(prev.voice_and_language || {}),
      ...(patch.voice_and_language || {}),
    },
  } as BusinessProfile

  // Always use the services from the patch if provided, otherwise keep existing
  const prevServices = Array.isArray(prev.services) ? prev.services : []
  if (Array.isArray((patch as any).services)) {
    ;(next as any).services = (patch as any).services
  } else {
    ;(next as any).services = prevServices
  }

  return next
}

export default function OnboardingPage() {
  const router = useRouter()
  const { tenantId, mounted } = useTenant()

  const [stepIndex, setStepIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)

  const [profile, setProfile] = useState<BusinessProfile>({
    name: '',
    business_type: 'general',
    time_zone: 'Africa/Lagos',
    payments: { currency: 'NGN' },
    opening_hours: {
      monday: '09:00-18:00',
      tuesday: '09:00-18:00',
      wednesday: '09:00-18:00',
      thursday: '09:00-18:00',
      friday: '09:00-18:00',
      saturday: '10:00-16:00',
      sunday: 'closed',
    },
    services: [
      {
        name: '',
        description: '',
        duration_minutes: 30,
        price: undefined,
        category: '',
      },
    ],
  })

  const activeStep = steps[stepIndex]

  const completeness = useMemo(() => {
    const checks = [
      Boolean(profile.name?.trim()),
      Boolean(profile.location?.trim()),
      Boolean(profile.contact_phone?.trim()),
      Boolean(profile.opening_hours && Object.keys(profile.opening_hours).length),
      Boolean(profile.services?.filter((s) => s.name?.trim()).length),
      Boolean(profile.refunds?.refund_policy?.trim() || profile.booking_rules),
    ]
    const score = Math.round((checks.filter(Boolean).length / checks.length) * 100)
    return Math.min(100, Math.max(0, score))
  }, [profile])

  useEffect(() => {
    if (!mounted) return
    if (!tenantId) {
      router.replace('/login')
      return
    }

    const load = async () => {
      try {
        const existing = await api.getBusinessProfile(tenantId)
        if (existing && typeof existing === 'object') {
          setProfile((prev) => mergeProfile(prev, existing))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenantId, mounted, router])

  const saveProfile = async () => {
    if (!tenantId) return
    setSaving(true)
    try {
      await api.updateBusinessProfile(tenantId, profile)
      router.push('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const onStepHint = (hint: string) => {
    const map: Record<string, StepKey> = {
      basic_info: 'basic',
      opening_hours: 'hours',
      services: 'services',
      booking_rules: 'policies',
      payments_policies: 'policies',
      brand_voice: 'policies',
    }
    const key = map[hint]
    if (!key) return
    const idx = steps.findIndex((s) => s.key === key)
    if (idx >= 0) setStepIndex(idx)
  }

  const updateService = (
    idx: number,
    patch: Partial<BusinessProfile['services'][number]>,
  ) => {
    setProfile((prev) => {
      const next = [...(prev.services || [])]
      next[idx] = { ...(next[idx] || { name: '' }), ...patch }
      return { ...prev, services: next }
    })
  }

  const addService = () => {
    setProfile((prev) => ({
      ...prev,
      services: [
        ...(prev.services || []),
        {
          name: '',
          description: '',
          duration_minutes: 30,
          price: undefined,
          category: '',
        },
      ],
    }))
  }

  const removeService = (idx: number) => {
    setProfile((prev) => ({
      ...prev,
      services: (prev.services || []).filter((_, i) => i !== idx),
    }))
  }

  const uploadToField = async (
    file: File,
    field: 'profile_image_url' | 'cover_image_url',
  ) => {
    try {
      const { url } = await api.uploadImage(file)
      setProfile((prev) => ({ ...prev, [field]: url }))
    } catch {
      // ignore
    }
  }

  const uploadServiceImage = async (idx: number, file: File) => {
    try {
      const { url } = await api.uploadImage(file)
      updateService(idx, { image_url: url })
    } catch {
      // ignore
    }
  }

  const polishField = async (field: 'tagline' | 'refund_policy') => {
    if (!tenantId) return
    const raw =
      field === 'tagline'
        ? profile.tagline || ''
        : profile.refunds?.refund_policy || ''
    if (!raw.trim()) {
      alert('Please enter some text first before polishing.')
      return
    }
    try {
      const res = await api.polishText(tenantId, field, raw)
      const suggested = String(res?.suggested_text || '').trim()
      if (!suggested) {
        alert('No suggestions available. The AI service might not be configured with a GROQ API key.')
        return
      }
      if (!confirm(`Apply this improved text?\n\n${suggested}`)) return
      if (field === 'tagline') {
        setProfile((prev) => ({ ...prev, tagline: suggested }))
      } else {
        setProfile((prev) => ({
          ...prev,
          refunds: { ...(prev.refunds || {}), refund_policy: suggested },
        }))
      }
    } catch (error) {
      console.error('Polish error:', error)
      alert('Polish feature is not available. Please add your GROQ API key to services/api/.env file.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Loading profile…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Business Profile Setup
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Configure your storefront and power your WhatsApp agent.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Setup assistant
            </button>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Progress
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {completeness}%
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  style={{ width: `${completeness}%` }}
                />
              </div>

              <div className="mt-5 space-y-2">
                {steps.map((s, idx) => {
                  const active = idx === stepIndex
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setStepIndex(idx)}
                      className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                        active
                          ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'
                          : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="text-sm font-semibold">{s.title}</div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {s.description}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                Paste your menu/policies into the assistant to auto‑fill and power retrieval.
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {activeStep.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Step {stepIndex + 1} of {steps.length}
                </div>
              </div>

              <div className="mt-6 space-y-6">
                {activeStep.key === 'basic' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelBase}>Business name</label>
                      <input
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                        className={inputBase}
                        placeholder="Blades Cutz"
                      />
                    </div>

                    <div>
                      <label className={labelBase}>Business type</label>
                      <select
                        value={profile.business_type}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            business_type: e.target.value,
                          })
                        }
                        className={inputBase}
                      >
                        <option value="general">General</option>
                        <option value="barber">Barber / Grooming</option>
                        <option value="salon">Salon / Spa</option>
                        <option value="restaurant">Restaurant / Food</option>
                        <option value="boutique">Boutique</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelBase}>Time zone</label>
                      <input
                        value={profile.time_zone || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, time_zone: e.target.value })
                        }
                        className={inputBase}
                        placeholder="Africa/Lagos or UTC+1"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelBase}>Location</label>
                      <input
                        value={profile.location || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, location: e.target.value })
                        }
                        className={inputBase}
                        placeholder="Area/city or full address"
                      />
                    </div>

                    <div>
                      <label className={labelBase}>Contact phone</label>
                      <input
                        value={profile.contact_phone || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, contact_phone: e.target.value })
                        }
                        className={inputBase}
                        placeholder="+234…"
                      />
                    </div>

                    <div>
                      <label className={labelBase}>WhatsApp number</label>
                      <input
                        value={profile.whatsapp_number || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, whatsapp_number: e.target.value })
                        }
                        className={inputBase}
                        placeholder="+234…"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelBase}>Tagline</label>
                      <div className="flex gap-2">
                        <input
                          value={profile.tagline || ''}
                          onChange={(e) =>
                            setProfile({ ...profile, tagline: e.target.value })
                          }
                          className={inputBase}
                          placeholder="Short and memorable"
                        />
                        <button
                          type="button"
                          onClick={() => polishField('tagline')}
                          className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          Polish
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={labelBase}>Profile photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className={inputBase}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) uploadToField(f, 'profile_image_url')
                        }}
                      />
                    </div>

                    <div>
                      <label className={labelBase}>Cover photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className={inputBase}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) uploadToField(f, 'cover_image_url')
                        }}
                      />
                    </div>
                  </div>
                )}

                {activeStep.key === 'hours' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(
                      [
                        'monday',
                        'tuesday',
                        'wednesday',
                        'thursday',
                        'friday',
                        'saturday',
                        'sunday',
                      ] as const
                    ).map((day) => (
                      <div key={day}>
                        <label className={labelBase}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </label>
                        <input
                          value={profile.opening_hours?.[day] || ''}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              opening_hours: {
                                ...(prev.opening_hours || {}),
                                [day]: e.target.value,
                              },
                            }))
                          }
                          className={inputBase}
                          placeholder="09:00-18:00 or closed"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {activeStep.key === 'services' && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            Pricing settings
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                            Choose the currency your customers see across the app.
                          </div>
                        </div>
                        <div className="w-full sm:w-48">
                          <label className={labelBase}>Currency</label>
                          <select
                            value={profile.payments?.currency || 'NGN'}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                payments: {
                                  ...(prev.payments || {}),
                                  currency: e.target.value,
                                },
                              }))
                            }
                            className={inputBase}
                          >
                            <option value="NGN">NGN (₦)</option>
                            <option value="USD">USD ($)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {(profile.services || []).map((s, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            Service {idx + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeService(idx)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-300"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-3 grid sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label className={labelBase}>Name</label>
                            <input
                              value={s.name || ''}
                              onChange={(e) =>
                                updateService(idx, { name: e.target.value })
                              }
                              className={inputBase}
                              placeholder="Regular haircut"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelBase}>Description</label>
                            <input
                              value={s.description || ''}
                              onChange={(e) =>
                                updateService(idx, { description: e.target.value })
                              }
                              className={inputBase}
                              placeholder="One sentence describing the service"
                            />
                          </div>
                          <div>
                            <label className={labelBase}>
                              Price ({profile.payments?.currency || 'NGN'})
                            </label>
                            <input
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={s.price == null ? '' : String(s.price)}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '') {
                                  updateService(idx, { price: undefined })
                                  return
                                }
                                const digitsOnly = value.replace(/[^\d]/g, '')
                                if (digitsOnly === '') {
                                  updateService(idx, { price: undefined })
                                  return
                                }
                                updateService(idx, { price: Number(digitsOnly) })
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && e.currentTarget.value === '0') {
                                  e.preventDefault()
                                  updateService(idx, { price: undefined })
                                }
                              }}
                              className={inputBase}
                              placeholder="3000"
                            />
                          </div>
                          <div>
                            <label className={labelBase}>Duration (mins)</label>
                            <input
                              type="number"
                              value={s.duration_minutes ?? ''}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '') {
                                  updateService(idx, { duration_minutes: undefined })
                                  return
                                }
                                updateService(idx, { duration_minutes: Number(value) })
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && e.currentTarget.value === '0') {
                                  e.preventDefault()
                                  updateService(idx, { duration_minutes: undefined })
                                }
                              }}
                              className={inputBase}
                              placeholder="30"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelBase}>Category</label>
                            <input
                              value={s.category || ''}
                              onChange={(e) =>
                                updateService(idx, { category: e.target.value })
                              }
                              className={inputBase}
                              placeholder="Haircut / Meals / Products"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={labelBase}>Image (optional)</label>
                            <input
                              type="file"
                              accept="image/*"
                              className={inputBase}
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) uploadServiceImage(idx, f)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addService}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                    >
                      Add service
                    </button>
                  </div>
                )}

                {activeStep.key === 'policies' && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                      For the smartest setup, use the assistant to paste your policies and booking rules. You can still tweak fields below.
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className={labelBase}>Booking types (comma separated)</label>
                        <input
                          value={(profile.booking_rules?.booking_types || []).join(', ')}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              booking_rules: {
                                ...(prev.booking_rules || {}),
                                booking_types: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              },
                            }))
                          }
                          className={inputBase}
                          placeholder="appointment, walk_in, delivery"
                        />
                      </div>
                      <div>
                        <label className={labelBase}>Max days in advance</label>
                        <input
                          type="number"
                          value={profile.booking_rules?.max_days_in_advance ?? 7}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              booking_rules: {
                                ...(prev.booking_rules || {}),
                                max_days_in_advance: Number(e.target.value),
                              },
                            }))
                          }
                          className={inputBase}
                        />
                      </div>
                      <div>
                        <label className={labelBase}>Buffer minutes</label>
                        <input
                          type="number"
                          value={profile.booking_rules?.buffer_minutes ?? 10}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              booking_rules: {
                                ...(prev.booking_rules || {}),
                                buffer_minutes: Number(e.target.value),
                              },
                            }))
                          }
                          className={inputBase}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelBase}>Refund / cancellation policy</label>
                        <div className="flex gap-2">
                          <textarea
                            value={profile.refunds?.refund_policy || ''}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                refunds: {
                                  ...(prev.refunds || {}),
                                  refund_policy: e.target.value,
                                },
                              }))
                            }
                            rows={3}
                            className={inputBase}
                            placeholder="Explain cancellations, refunds, reschedules…"
                          />
                          <button
                            type="button"
                            onClick={() => polishField('refund_policy')}
                            className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                          >
                            Polish
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  disabled={stepIndex === 0}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {stepIndex < steps.length - 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setStepIndex((i) => Math.min(steps.length - 1, i + 1))
                      }
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500"
                    >
                      Next
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save & finish'}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {tenantId && (
        <SetupAssistantDrawer
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          tenantId={tenantId}
          profile={profile}
          onProfilePatch={(patch) => setProfile((prev) => mergeProfile(prev, patch))}
          onStepHint={onStepHint}
        />
      )}
    </div>
  )
}
