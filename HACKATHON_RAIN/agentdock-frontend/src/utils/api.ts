function getApiBaseUrl() {
  // If explicitly configured, always use that.
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }

  // When running in the browser, point to the same host
  // as the frontend but on port 5000. This makes it work
  // both on localhost and when accessed via LAN IP.
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    const port = '5000'
    return `${protocol}//${hostname}:${port}`
  }

  // Sensible default for SSR/build tools.
  return 'http://localhost:5000'
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function refreshAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null

  const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as any
  if (data?.auth_token) localStorage.setItem('auth_token', String(data.auth_token))
  if (data?.refresh_token) localStorage.setItem('refresh_token', String(data.refresh_token))
  return data?.auth_token ? String(data.auth_token) : null
}

async function fetchJson(
  url: string,
  init?: RequestInit,
  opts?: { retryAuth?: boolean },
): Promise<any> {
  const response = await fetch(url, init)
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '')

  if (response.ok) return body

  if (
    opts?.retryAuth !== false &&
    response.status === 401 &&
    body &&
    typeof body === 'object' &&
    (body as any).error === 'token_expired'
  ) {
    const newToken = await refreshAuthToken()
    if (newToken) {
      const retryInit: RequestInit = {
        ...(init || {}),
        headers: {
          ...((init?.headers as any) || {}),
          Authorization: `Bearer ${newToken}`,
        },
      }
      const retry = await fetch(url, retryInit)
      const retryType = retry.headers.get('content-type') || ''
      if (retryType.includes('application/json')) return retry.json()
      return retry.text()
    }
  }

  if (body && typeof body === 'object' && (body as any).error) {
    throw new Error(String((body as any).error))
  }
  throw new Error('Request failed')
}

export interface BusinessProfile {
  name: string
  business_type: string
  business_code?: string
  tagline?: string
  profile_image_url?: string
  cover_image_url?: string
  location?: string
  contact_phone?: string
  whatsapp_number?: string
  time_zone: string
  opening_hours: {
    monday?: string
    tuesday?: string
    wednesday?: string
    thursday?: string
    friday?: string
    saturday?: string
    sunday?: string
  }
  services: Array<{
    id?: string
    name: string
    description?: string
    duration_minutes?: number
    price?: number
    category?: string
    image_url?: string
  }>
  booking_rules?: {
    booking_types?: string[]
    max_days_in_advance?: number
    buffer_minutes?: number
    required_fields?: string[]
    late_policy?: string
    no_show_policy?: string
  }
  payments?: {
    currency?: string
    methods?: string[]
    deposit_required?: boolean
  }
  refunds?: {
    cancellation_window_hours?: number
    refund_policy?: string
    quality_policy?: string
  }
  voice_and_language?: {
    tone?: string
    use_slang?: boolean
    languages?: string[]
    avoid?: string[]
  }
}

export const api = {
  async createTenant(data: { name: string; business_type: string; email?: string; password?: string }) {
    const response = await fetch(`${getApiBaseUrl()}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async getBusinessProfile(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/business-profile`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async updateBusinessProfile(tenantId: number, profile: BusinessProfile) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/business-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(profile),
    })
  },

  async createAgent(data: { tenant_id: number; display_name: string; default_language: string; welcome_message: string }) {
    const response = await fetch(`${getApiBaseUrl()}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async demoChat(data: { tenant_id: number; message: string; customer_name?: string; customer_phone?: string }) {
    const response = await fetch(`${getApiBaseUrl()}/demo/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async polishText(tenantId: number, field: string, text: string) {
    const response = await fetch(`${getApiBaseUrl()}/polish-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, field, text }),
    })
    return response.json()
  },

  async getFaqSuggestions(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/faq-suggestions`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async getCoachingInsights(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/coaching-insights`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async listTenants() {
    const response = await fetch(`${getApiBaseUrl()}/tenants`)
    return response.json()
  },

  async getKnowledge(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/knowledge`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async updateKnowledge(tenantId: number, rawText: string) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/knowledge`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ raw_text: rawText }),
    })
  },

  async uploadKnowledgeFile(tenantId: number, file: File, opts?: { append?: boolean }) {
    const form = new FormData()
    form.append('file', file)
    form.append('append', String(opts?.append ?? true))

    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/knowledge/upload`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: form,
    })
  },

  async listConversations(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/conversations`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async markConversationRead(tenantId: number, customerId: number) {
    return fetchJson(
      `${getApiBaseUrl()}/tenants/${tenantId}/conversations/${customerId}/read`,
      {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      },
    )
  },

  async setupAssistant(params: {
    tenant_id: number
    message: string
    business_profile: BusinessProfile
    history: { from: 'assistant' | 'user'; text: string }[]
  }) {
    const response = await fetch(`${getApiBaseUrl()}/setup-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    return response.json()
  },

  async getStats(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/stats`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async getAppointments(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/appointments`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async clearAppointments(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/appointments`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
  },

  async getMessages(tenantId: number, customerId?: number | null) {
    const url =
      customerId != null
        ? `${getApiBaseUrl()}/tenants/${tenantId}/messages?customer_id=${customerId}`
        : `${getApiBaseUrl()}/tenants/${tenantId}/messages`
    return fetchJson(url, { headers: { ...getAuthHeaders() } })
  },

  async getConversationSummary(tenantId: number, customerId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/conversations/${customerId}/summary`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async deleteMessage(messageId: number) {
    return fetchJson(`${getApiBaseUrl()}/messages/${messageId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
  },

  async clearMessages(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/messages`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
  },

  async resetTenant(tenantId: number, opts?: { wipe_profile?: boolean }) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(opts || {}),
    })
  },

  async updateAppointmentStatus(appointmentId: number, status: string) {
    return fetchJson(`${getApiBaseUrl()}/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    })
  },

  async getOrders(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/orders`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async updateOrderStatus(orderId: number, status: string) {
    return fetchJson(`${getApiBaseUrl()}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    })
  },

  async getComplaints(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/complaints`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async updateComplaintStatus(complaintId: number, status: string, notes?: string) {
    return fetchJson(`${getApiBaseUrl()}/complaints/${complaintId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status, notes }),
    })
  },

  async getAnalytics(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/analytics`, {
      headers: { ...getAuthHeaders() },
    })
  },
}tchJson(`${getApiBaseUrl()}/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    })
  },

  async getOrders(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/orders`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async updateOrderStatus(orderId: number, status: string) {
    return api.updateOrder(orderId, { status })
  },

  async updateOrder(
    orderId: number,
    patch: {
      status?: string
      assigned_to?: string | null
      due_at?: string | null
      resolution_notes?: string | null
    },
  ) {
    return fetchJson(`${getApiBaseUrl()}/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(patch || {}),
    })
  },

  async getHandoffs(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/handoffs`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async getTrace(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/trace`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async updateHandoffStatus(handoffId: number, status: string) {
    return api.updateHandoff(handoffId, { status })
  },

  async updateHandoff(
    handoffId: number,
    patch: {
      status?: string
      assigned_to?: string | null
      due_at?: string | null
      resolution_notes?: string | null
    },
  ) {
    return fetchJson(`${getApiBaseUrl()}/handoffs/${handoffId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(patch || {}),
    })
  },

  async uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${getApiBaseUrl()}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    const data = (await response.json()) as { url: string }
    let url = data.url
    if (url && !url.startsWith('http')) {
      // Make sure we return an absolute URL that the frontend can render
      url = `${getApiBaseUrl()}${url}`
    }

    return { url }
  },

  async getComplaints(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/complaints`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async createComplaint(tenantId: number, complaint: {
    customer_name?: string
    customer_phone?: string
    complaint_details: string
    category?: string
    priority?: string
  }) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(complaint),
    })
  },

  async updateComplaint(
    complaintId: number,
    patch: {
      status?: string
      priority?: string
      assigned_agent?: string | null
      notes?: string | null
      category?: string | null
    },
  ) {
    return fetchJson(`${getApiBaseUrl()}/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(patch || {}),
    })
  },

  async login(email: string, password: string) {
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Invalid credentials')
    }

    return response.json() as Promise<{
      tenant_id: number
      tenant_name: string
      business_type?: string
      auth_token?: string
      expires_in?: number
      refresh_token?: string
    }>
  },

  async requestPasswordReset(email: string) {
    const response = await fetch(`${getApiBaseUrl()}/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return response.json()
  },

  async getAnalytics(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/analytics`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async getSentimentAnalysis(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/sentiment-analysis`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async getOptimizationSuggestions(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/optimization-suggestions`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async generateSocialContent(tenantId: number, params: {
    platform: string
    content_type: string
    service_focus?: string
    tone: string
  }) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/generate-social-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(params),
    })
  },

  async getPersonalization(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/personalization`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async updatePersonalization(tenantId: number, data: {
    customer_id: number
    preferences: any
  }) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/personalization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    })
  },
}
