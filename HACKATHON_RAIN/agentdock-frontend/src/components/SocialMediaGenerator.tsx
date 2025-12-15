'use client'

import { useState } from 'react'
import { api } from '@/utils/api'

interface SocialContent {
  content: string
  hashtags: string
  platform: string
  content_type: string
}

export default function SocialMediaGenerator({ tenantId }: { tenantId: number }) {
  const [platform, setPlatform] = useState('instagram')
  const [contentType, setContentType] = useState('promotion')
  const [serviceFocus, setServiceFocus] = useState('')
  const [tone, setTone] = useState('friendly')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<SocialContent | null>(null)
  const [copied, setCopied] = useState(false)

  const generateContent = async () => {
    setGenerating(true)
    try {
      const content = await api.generateSocialContent(tenantId, {
        platform,
        content_type: contentType,
        service_focus: serviceFocus,
        tone
      })
      setGeneratedContent(content)
    } catch (error) {
      console.error('Failed to generate content:', error)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (!generatedContent) return
    
    const fullContent = `${generatedContent.content}\n\n${generatedContent.hashtags}`
    try {
      await navigator.clipboard.writeText(fullContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">🎨 Social Media Content Generator</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Type
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="promotion">Promotion</option>
            <option value="service_highlight">Service Highlight</option>
            <option value="testimonial">Customer Testimonial</option>
            <option value="tips">Industry Tips</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Focus (Optional)
          </label>
          <input
            type="text"
            value={serviceFocus}
            onChange={(e) => setServiceFocus(e.target.value)}
            placeholder="e.g., Haircut, Massage, etc."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="luxury">Luxury</option>
            <option value="energetic">Energetic</option>
          </select>
        </div>
      </div>

      <button
        onClick={generateContent}
        disabled={generating}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {generating ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Generating...
          </div>
        ) : (
          '✨ Generate Content'
        )}
      </button>

      {generatedContent && (
        <div className="mt-6 space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Generated Content</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {generatedContent.platform}
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {generatedContent.content_type}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Post Content
                </label>
                <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-900 whitespace-pre-wrap">
                  {generatedContent.content}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Hashtags
                </label>
                <div className="bg-blue-50 rounded-md p-3 text-sm text-blue-900">
                  {generatedContent.hashtags}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {copied ? '✅ Copied!' : '📋 Copy All'}
              </button>
              <button
                onClick={generateContent}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                🔄 Regenerate
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-yellow-800 mb-2">💡 Pro Tips</h5>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Add your own images or videos to make posts more engaging</li>
              <li>• Post consistently - aim for 3-5 times per week</li>
              <li>• Engage with comments and messages promptly</li>
              <li>• Use location tags to attract local customers</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}