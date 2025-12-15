'use client'

import { useState, useEffect } from 'react'
import { api } from '@/utils/api'

interface CustomerProfile {
  customer_id: number
  name: string
  phone: string
  total_appointments: number
  preferred_services: string[]
  customer_tier: 'New' | 'Regular' | 'VIP'
  state: any
}

interface PersonalizationData {
  customer_profiles: CustomerProfile[]
}

export default function PersonalizationManager({ tenantId }: { tenantId: number }) {
  const [data, setData] = useState<PersonalizationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null)
  const [preferences, setPreferences] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [tenantId])

  const loadData = async () => {
    try {
      const personalizationData = await api.getPersonalization(tenantId)
      setData(personalizationData)
    } catch (error) {
      console.error('Failed to load personalization data:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!selectedCustomer) return
    
    setSaving(true)
    try {
      await api.updatePersonalization(tenantId, {
        customer_id: selectedCustomer.customer_id,
        preferences
      })
      await loadData() // Refresh data
      setSelectedCustomer(null)
      setPreferences({})
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'VIP': return 'bg-purple-100 text-purple-800'
      case 'Regular': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'VIP': return '👑'
      case 'Regular': return '⭐'
      default: return '🆕'
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">👥 Customer Personalization</h3>
        
        {/* Customer Tier Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {['VIP', 'Regular', 'New'].map(tier => {
            const count = data?.customer_profiles.filter(c => c.customer_tier === tier).length || 0
            return (
              <div key={tier} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl mb-1">{getTierIcon(tier)}</div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-500">{tier} Customers</div>
              </div>
            )
          })}
        </div>

        {/* Customer List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Customer Profiles</h4>
          {data?.customer_profiles && data.customer_profiles.length > 0 ? (
            <div className="space-y-2">
              {data.customer_profiles.map((customer) => (
                <div
                  key={customer.customer_id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-900">
                            {customer.name || 'Anonymous Customer'}
                          </h5>
                          <span className={`text-xs px-2 py-1 rounded-full ${getTierColor(customer.customer_tier)}`}>
                            {getTierIcon(customer.customer_tier)} {customer.customer_tier}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.phone} • {customer.total_appointments} appointments
                        </div>
                        {customer.preferred_services.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            Prefers: {customer.preferred_services.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer)
                        setPreferences(customer.state?.preferences || {})
                      }}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Customize
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p>No customer data available yet.</p>
              <p className="text-sm">Customer profiles will appear as they interact with your AI agent.</p>
            </div>
          )}
        </div>
      </div>

      {/* Personalization Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">
                Customize {selectedCustomer.name || 'Customer'}
              </h4>
              <button
                onClick={() => {
                  setSelectedCustomer(null)
                  setPreferences({})
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Communication Style
                </label>
                <select
                  value={preferences.communication_style || 'friendly'}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    communication_style: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="friendly">Friendly & Casual</option>
                  <option value="professional">Professional</option>
                  <option value="brief">Brief & Direct</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  value={preferences.contact_method || 'whatsapp'}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    contact_method: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Phone Call</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Notes
                </label>
                <textarea
                  value={preferences.notes || ''}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notes: e.target.value
                  })}
                  placeholder="Any special preferences or notes..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vip-treatment"
                  checked={preferences.vip_treatment || false}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    vip_treatment: e.target.checked
                  })}
                  className="rounded"
                />
                <label htmlFor="vip-treatment" className="text-sm text-gray-700">
                  VIP Treatment (priority booking, special offers)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="marketing-consent"
                  checked={preferences.marketing_consent || false}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    marketing_consent: e.target.checked
                  })}
                  className="rounded"
                />
                <label htmlFor="marketing-consent" className="text-sm text-gray-700">
                  Send promotional offers and updates
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setSelectedCustomer(null)
                  setPreferences({})
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePreferences}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personalization Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <h4 className="font-medium text-purple-900 mb-3">🎯 Personalization Benefits</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span>💬</span>
              <span>AI adapts communication style per customer</span>
            </div>
            <div className="flex items-start gap-2">
              <span>⭐</span>
              <span>VIP customers get priority treatment</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span>🎁</span>
              <span>Targeted offers based on preferences</span>
            </div>
            <div className="flex items-start gap-2">
              <span>📈</span>
              <span>Higher customer satisfaction & retention</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}