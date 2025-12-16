'use client'

import { useState, useEffect } from 'react'

export function useTenant() {
  const [tenantId, setTenantId] = useState<number | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('tenant_id')
    if (stored) {
      setTenantId(parseInt(stored))
    }
    const token = localStorage.getItem('auth_token')
    if (token) {
      setAuthToken(token)
    }
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) {
      setRefreshToken(refresh)
    }
  }, [])

  const storeTenantId = (id: number) => {
    localStorage.setItem('tenant_id', id.toString())
    setTenantId(id)
  }

  const storeAuthToken = (token: string) => {
    localStorage.setItem('auth_token', token)
    setAuthToken(token)
  }

  const storeRefreshToken = (token: string) => {
    localStorage.setItem('refresh_token', token)
    setRefreshToken(token)
  }

  const clearTenant = () => {
    localStorage.removeItem('tenant_id')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    setTenantId(null)
    setAuthToken(null)
    setRefreshToken(null)
  }

  return {
    tenantId: mounted ? tenantId : null,
    authToken: mounted ? authToken : null,
    refreshToken: mounted ? refreshToken : null,
    storeTenantId,
    storeAuthToken,
    storeRefreshToken,
    clearTenant,
    mounted,
  }
}
