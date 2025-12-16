'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useTenant as useTenantHook } from '@/hooks/useTenant'

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
  const tenantData = useTenantHook()
  return (
    <TenantContext.Provider value={tenantData}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}