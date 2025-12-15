'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { api } from '@/utils/api'
import { useTenant } from '@/hooks/useTenant'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'general',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const { storeTenantId, storeAuthToken, storeRefreshToken } = useTenant()

  const businessTypes = [
    { value: 'general', label: 'General (services or products)' },
    { value: 'barber', label: 'Barber / Grooming' },
    { value: 'salon', label: 'Beauty Salon / Spa' },
    { value: 'restaurant', label: 'Restaurant / Food' },
    { value: 'boutique', label: 'Boutique / Fashion' },
    { value: 'other', label: 'Other' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.createTenant({
        name: formData.businessName,
        business_type: formData.businessType,
        email: formData.email,
        password: formData.password,
      })
      storeTenantId(response.id)
      
      // Automatically log the user in after account creation
      try {
        const loginResult = await api.login(formData.email, formData.password)
        if (loginResult.auth_token) {
          storeAuthToken(loginResult.auth_token)
        }
        if ((loginResult as any).refresh_token) {
          storeRefreshToken((loginResult as any).refresh_token)
        }
      } catch (loginError) {
        console.warn('Auto-login failed after signup:', loginError)
      }
      
      router.push('/onboarding')
    } catch {
      setError('Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your AgentDock workspace"
      subtitle="Set up an AI WhatsApp agent for your business in minutes."
      mode="signup"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label
            htmlFor="businessName"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            Business name
          </label>
          <input
            id="businessName"
            type="text"
            required
            value={formData.businessName}
            onChange={(e) =>
              setFormData({ ...formData, businessName: e.target.value })
            }
            className="mt-0.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500"
            placeholder="Blades Cutz"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="businessType"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            Business type
          </label>
          <select
            id="businessType"
            value={formData.businessType}
            onChange={(e) =>
              setFormData({ ...formData, businessType: e.target.value })
            }
            className="mt-0.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
          >
            {businessTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            Work email
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-0.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500"
            placeholder="you@business.com"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="mt-0.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500"
            placeholder="Create a strong password"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-900/60">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}

