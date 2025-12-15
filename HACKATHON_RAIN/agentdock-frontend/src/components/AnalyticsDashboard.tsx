'use client'

import { useState, useEffect } from 'react'
import { api } from '@/utils/api'

interface AnalyticsData {
  peak_hours: Array<{ hour: string; bookings: number }>
  popular_services: Array<{ service: string; bookings: number }>
  repeat_customers: number
  revenue_30_days: number
  insights: string[]
}

interface SentimentData {
  overall_sentiment: 'positive' | 'neutral' | 'negative'
  sentiment_breakdown: {
    positive: number
    neutral: number
    negative: number
  }
  total_messages: number
  insights: string[]
}

interface OptimizationSuggestion {
  type: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
}

export default function AnalyticsDashboard({ tenantId }: { tenantId: number }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [sentiment, setSentiment] = useState<SentimentData | null>(null)
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [analyticsData, sentimentData, suggestionsData] = await Promise.all([
          api.getAnalytics(tenantId),
          api.getSentimentAnalysis(tenantId),
          api.getOptimizationSuggestions(tenantId)
        ])
        setAnalytics(analyticsData)
        setSentiment(sentimentData)
        setSuggestions(suggestionsData.suggestions || [])
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [tenantId])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50'
      case 'negative': return 'text-red-600 bg-red-50'
      default: return 'text-yellow-600 bg-yellow-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-sm text-gray-500">Revenue (30 days)</div>
          <div className="text-2xl font-bold text-gray-900">
            ${analytics?.revenue_30_days?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-sm text-gray-500">Repeat Customers</div>
          <div className="text-2xl font-bold text-gray-900">
            {analytics?.repeat_customers || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-sm text-gray-500">Customer Sentiment</div>
          <div className={`text-lg font-semibold px-2 py-1 rounded-full inline-block ${getSentimentColor(sentiment?.overall_sentiment || 'neutral')}`}>
            {sentiment?.overall_sentiment || 'neutral'}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-sm text-gray-500">Messages Analyzed</div>
          <div className="text-2xl font-bold text-gray-900">
            {sentiment?.total_messages || 0}
          </div>
        </div>
      </div>

      {/* Peak Hours Chart */}
      {analytics?.peak_hours && analytics.peak_hours.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Peak Booking Hours</h3>
          <div className="space-y-2">
            {analytics.peak_hours.map((hour, index) => (
              <div key={hour.hour} className="flex items-center justify-between">
                <span className="text-sm font-medium">{hour.hour}</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="bg-blue-500 h-4 rounded"
                    style={{ width: `${(hour.bookings / Math.max(...analytics.peak_hours.map(h => h.bookings))) * 200}px` }}
                  ></div>
                  <span className="text-sm text-gray-600">{hour.bookings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Services */}
      {analytics?.popular_services && analytics.popular_services.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Popular Services</h3>
          <div className="space-y-3">
            {analytics.popular_services.map((service, index) => (
              <div key={service.service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{service.service}</span>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {service.bookings} bookings
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sentiment Breakdown */}
      {sentiment && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Customer Sentiment Analysis</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sentiment.sentiment_breakdown.positive}%</div>
              <div className="text-sm text-gray-500">Positive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{sentiment.sentiment_breakdown.neutral}%</div>
              <div className="text-sm text-gray-500">Neutral</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{sentiment.sentiment_breakdown.negative}%</div>
              <div className="text-sm text-gray-500">Negative</div>
            </div>
          </div>
          {sentiment.insights.length > 0 && (
            <div className="space-y-2">
              {sentiment.insights.map((insight, index) => (
                <div key={index} className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  💡 {insight}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">AI Optimization Suggestions</h3>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(suggestion.priority)}`}>
                    {suggestion.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{suggestion.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Category: {suggestion.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Insights */}
      {analytics?.insights && analytics.insights.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Business Insights</h3>
          <div className="space-y-2">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                📊 {insight}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}