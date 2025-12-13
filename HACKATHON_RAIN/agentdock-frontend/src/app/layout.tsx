import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

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
        className={`${inter.className} bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-50`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  )
}
