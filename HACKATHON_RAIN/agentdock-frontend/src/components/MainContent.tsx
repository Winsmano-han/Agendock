'use client'

import { useSidebar } from '@/contexts/SidebarContext'
import { useTenant } from '@/hooks/useTenant'

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  const { tenantId } = useTenant()

  return (
    <div className={`transition-all duration-300 ${
      tenantId ? (collapsed ? 'lg:pl-16 pl-0' : 'lg:pl-64 pl-0') : 'pl-0'
    }`}>
      {children}
    </div>
  )
}