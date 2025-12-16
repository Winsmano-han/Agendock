'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/hooks/useTenant'
import { api } from '@/utils/api'

export default function SettingsPage() {
  const { tenantId, clearTenant, mounted } = useTenant()
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [deleting, setDeleting] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mounted) return
    if (!tenantId) {
      router.replace('/login')
      return
    }

    // Load theme from localStorage
    try {
      const stored = window.localStorage.getItem('agentdock_theme')
      const initial = stored === 'dark' || stored === 'light' ? stored : 'light'
      setTheme(initial)
    } catch {
      setTheme('light')
    }

    // Load business profile
    const loadProfile = async () => {
      try {
        const profileData = await api.getBusinessProfile(tenantId)
        setProfile(profileData)
      } catch (err) {
        console.error('Failed to load profile', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [tenantId, mounted, router])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      window.localStorage.setItem('agentdock_theme', next)
    } catch {
      // ignore
    }
  }

  const handleDeleteProfile = async () => {
    if (!tenantId) return

    const confirmText = `DELETE ${profile?.name || 'BUSINESS'}`
    const userInput = prompt(
      `⚠️ WARNING: This will permanently delete your entire business profile, all data, conversations, bookings, and settings.\n\nThis action CANNOT be undone.\n\nType "${confirmText}" to confirm deletion:`
    )

    if (userInput !== confirmText) {
      alert('Deletion cancelled - text did not match.')
      return
    }

    setDeleting(true)
    try {
      await api.deleteProfile(tenantId)
      alert('Your business profile has been permanently deleted.')
      clearTenant()
      router.push('/signup')
    } catch (err: any) {
      alert(`Failed to delete profile: ${err.message || 'Unknown error'}`)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account preferences and business profile settings.
          </p>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Dark Mode
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Toggle between light and dark themes
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Business Profile Info */}
        {profile && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Business Profile
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Business Name:
                </span>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {profile.name || 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Business Type:
                </span>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {profile.business_type || 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Business Code:
                </span>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {profile.business_code || 'Not set'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Account Actions
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Reset Demo Data
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Clear all messages, bookings, and demo data (keeps profile)
                </p>
              </div>
              <button
                onClick={async () => {
                  if (window.confirm('Clear all demo data? This will remove messages and bookings but keep your profile.')) {
                    try {
                      await api.resetTenant(tenantId!, { wipe_profile: false })
                      alert('Demo data cleared successfully!')
                    } catch (err: any) {
                      alert(`Failed to reset: ${err.message}`)
                    }
                  }
                }}
                className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Reset Data
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div>
                <h3 className="text-sm font-medium text-red-900 dark:text-red-200">
                  Delete Business Profile
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Permanently delete your entire business profile and all data. This cannot be undone.
                </p>
              </div>
              <button
                onClick={handleDeleteProfile}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}