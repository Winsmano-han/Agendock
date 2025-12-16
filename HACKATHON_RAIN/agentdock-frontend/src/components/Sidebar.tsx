'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTenant } from '@/hooks/useTenant'
import { useSidebar } from '@/contexts/SidebarContext'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { tenantId, clearTenant } = useTenant()
  const { collapsed, toggleCollapsed } = useSidebar()

  const handleLogout = () => {
    clearTenant()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  const menuItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/services', label: 'Services', icon: '⚙️' },
    { path: '/orders', label: 'Orders', icon: '📦' },
    { path: '/bookings', label: 'Bookings', icon: '📅' },
    { path: '/complaints', label: 'Complaints', icon: '⚠️' },
    { path: '/handoffs', label: 'Handoffs', icon: '🤝' },
    { path: '/chats', label: 'Conversations', icon: '💬' },
    { path: '/trace', label: 'Trace', icon: '🔍' },
    { path: '/agent-preview', label: 'Live Preview', icon: '👁️' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  if (!tenantId) return null

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleCollapsed}
        />
      )}
      
      <div className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } ${collapsed ? '' : 'lg:translate-x-0'} ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-bold">
              A
            </span>
            <span className="font-bold text-gray-900 dark:text-white">AgentDock</span>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={collapsed ? item.label : undefined}
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
        
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title={collapsed ? 'Logout' : undefined}
        >
          <span className="text-lg">🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </nav>
      </div>
    </>
  )
}