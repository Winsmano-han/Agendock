'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface TenantContextType {
  tenantId: number | null
  authToken: string | null
  refreshToken: string | null
  storeTenantId: (id: number) => void
  storeAuthToken: (token: string) => void
  storeRefreshToken: (token: string) => void
  clearTenant: () => void
  mounted: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const tenantData = useTenantInternal()
  return (
    <TenantContext.Provider value={tenantData}>
      {children}
    </TenantContext.Provider>
  )
}

function useTenantInternal() {

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

function useTenantInternal() {
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
