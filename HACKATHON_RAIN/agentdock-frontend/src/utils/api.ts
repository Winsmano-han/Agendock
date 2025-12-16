function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    return `${protocol}//${hostname}:5000`
  }
  return 'http://localhost:5000'
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const response = await fetch(url, init)
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '')

  if (response.ok) return body
  if (body && typeof body === 'object' && (body as any).error) {
    throw new Error(String((body as any).error))
  }
  throw new Error('Request failed')
}

export interface BusinessProfile {
  name: string
  business_type: string
  business_code?: string
  time_zone: string
  opening_hours: Record<string, string>
  services: Array<{
    name: string
    price?: number
  }>
}

export const api = {
  async login(email: string, password: string) {
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) throw new Error('Invalid credentials')
    return response.json()
  },

  async getBusinessProfile(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/business-profile`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async getAppointments(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/appointments`, {
      headers: { ...getAuthHeaders() },
    })
  },

  async updateAppointmentStatus(appointmentId: number, status: string) {
    return fetchJson(`${getApiBaseUrl()}/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status }),
    })
  },

  async resetTenant(tenantId: number, opts?: { wipe_profile?: boolean }) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(opts || {}),
    })
  },

  async deleteProfile(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
  },

  async requestPasswordReset(email: string) {
    const response = await fetch(`${getApiBaseUrl()}/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return response.json()
  },

  async resetPassword(resetToken: string, newPassword: string) {
    const response = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
    })
    return response.json()
  },

  async checkEmail(email: string) {
    const response = await fetch(`${getApiBaseUrl()}/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return response.json()
  },

  async getHandoffs(tenantId: number) {
    return fetchJson(`${getApiBaseUrl()}/tenants/${tenantId}/handoffs`, {
      headers: { ...getAuthHeaders() },
    })
  },
}