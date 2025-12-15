'use client'

import { useState } from 'react'
import { useTenant } from '@/hooks/useTenant'
import { useRouter } from 'next/navigation'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import SocialMediaGenerator from '@/components/SocialMediaGenerator'
import PersonalizationManager from '@/components/PersonalizationManager'

export default function AIFeaturesPage() {
  const { tenantId, mounted } = useTenant()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('analytics')

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!tenantId) {
    router.replace('/login')
    return null
  }

  const tabs = [
    { id: 'analytics', name: '📊 Analytics & Insights', description: 'Business intelligence and customer sentiment' },
    { id: 'social', name: '🎨 Social Media', description: 'AI-generated promotional content' },
    { id: 'personalization', name: '👥 Personalization', description: 'Customer preferences and VIP management' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🤖 AI Features</h1>
              <p className="mt-2 text-gray-600">
                Advanced AI capabilities to grow your business and delight customers
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
            <div className="text-2xl mb-2">🧠</div>
            <h3 className="text-lg font-semibold mb-2">Multi-Language AI</h3>
            <p className="text-blue-100 text-sm">
              Automatically detects and responds in customer's language (Spanish, French, German, Portuguese, Italian)
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
            <div className="text-2xl mb-2">🎭</div>
            <h3 className="text-lg font-semibold mb-2">Agent Personalities</h3>
            <p className="text-purple-100 text-sm">
              Customizable AI personality matching your brand voice - from casual to luxury
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
            <div className="text-2xl mb-2">📱</div>
            <h3 className="text-lg font-semibold mb-2">WhatsApp Alerts</h3>
            <p className="text-green-100 text-sm">
              Instant notifications to business owners for new bookings, orders, and complaints
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span>{tab.name}</span>
                    <span className="text-xs text-gray-400 font-normal mt-1">
                      {tab.description}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'analytics' && <AnalyticsDashboard tenantId={tenantId} />}
            {activeTab === 'social' && <SocialMediaGenerator tenantId={tenantId} />}
            {activeTab === 'personalization' && <PersonalizationManager tenantId={tenantId} />}
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">🚀 Coming Soon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 opacity-75">
              <div className="text-xl mb-2">📞</div>
              <h4 className="font-medium text-gray-900 mb-1">Voice Calls</h4>
              <p className="text-xs text-gray-600">AI-powered phone booking system</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 opacity-75">
              <div className="text-xl mb-2">🔍</div>
              <h4 className="font-medium text-gray-900 mb-1">Visual Search</h4>
              <p className="text-xs text-gray-600">Upload service photos for AI descriptions</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 opacity-75">
              <div className="text-xl mb-2">🎯</div>
              <h4 className="font-medium text-gray-900 mb-1">Smart Targeting</h4>
              <p className="text-xs text-gray-600">AI-powered customer segmentation</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 opacity-75">
              <div className="text-xl mb-2">🔮</div>
              <h4 className="font-medium text-gray-900 mb-1">Predictive Analytics</h4>
              <p className="text-xs text-gray-600">Forecast demand and optimize pricing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}