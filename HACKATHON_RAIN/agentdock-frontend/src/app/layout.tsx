import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import MainContent from '@/components/MainContent'
import { TenantProvider } from '@/contexts/TenantContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { ToastProvider } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgentDock - AI WhatsApp Agents for Business',
  description: 'Spin up an AI WhatsApp agent for your business in minutes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-50`}
      >
        <TenantProvider>
          <SidebarProvider>
            <ToastProvider>
              <Navbar />
              <Sidebar />
              <MainContent>
                {children}
              </MainContent>
            </ToastProvider>
          </SidebarProvider>
        </TenantProvider>
      </body>
    </html>
  )
}
