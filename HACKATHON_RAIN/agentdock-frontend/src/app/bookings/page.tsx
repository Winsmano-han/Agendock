'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { api, BusinessProfile } from '@/utils/api'
import { useTenant } from '@/hooks/useTenant'

type Appointment = {
  id: number
  tenant_id: number
  customer_id: number | null
  service_id: number | null
  service_name?: string | null
  customer_name: string | null
  customer_phone: string | null
  start_time: string
  status: string
}

export default function BookingsPage() {
  const { tenantId, mounted } = useTenant()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [servicesMap, setServicesMap] = useState<Record<number, string>>({})
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [clearing, setClearing] = useState(false)

  const loadServices = (servicesData: any[]) => {
    const map: Record<number, string> = {}
    if (Array.isArray(servicesData)) {
      for (const s of servicesData) {
        if (s.id && s.name) {
          map[s.id] = s.name
        }
      }
    }
    setServicesMap(map)
  }

  const loadInitial = async (tid: number) => {
    const [apptData, profileData, servicesData] = await Promise.all([
      api.getAppointments(tid),
      api.getBusinessProfile(tid),
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/tenants/${tid}/services`,
      ).then((r) => r.json()),
    ])
    setAppointments(apptData || [])
    setProfile(profileData || null)
    loadServices(servicesData)
  }

  const refreshAppointments = async (tid: number) => {
    try {
      const [apptData, servicesData] = await Promise.all([
        api.getAppointments(tid),
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/tenants/${tid}/services`,
        ).then((r) => r.json()),
      ])
      setAppointments(apptData || [])
      loadServices(servicesData)
    } catch (err) {
      console.error('Failed to refresh appointments', err)
    }
  }

  useEffect(() => {
    if (!mounted) return
    if (!tenantId) {
      router.replace('/login')
      return
    }

    const tid = tenantId

    const setup = async () => {
      try {
        await loadInitial(tid)
      } catch (err) {
        console.error('Failed to load bookings data', err)
      } finally {
        setLoading(false)
      }
    }

    setup()

    // Poll for new appointments every 8 seconds so WhatsApp / web bookings
    // show up without a manual refresh.
    const intervalId = window.setInterval(() => {
      refreshAppointments(tid)
    }, 8000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [tenantId, mounted, router, loadInitial, refreshAppointments])

  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'all') return appointments
    return appointments.filter((a) => a.status === statusFilter)
  }, [appointments, statusFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading bookings…</p>
      </div>
    )
  }

  const handleClearAll = async () => {
    if (!tenantId) return
    if (!window.confirm('Delete all bookings for this business?')) return
    setClearing(true)
    try {
      await api.clearAppointments(tenantId)
      setAppointments([])
    } catch (err) {
      console.error('Failed to clear appointments', err)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bookings{profile?.name ? ` – ${profile.name}` : ''}
            </h1>
            <p className="text-sm text-gray-600">
              View all appointments your AI agent has created or that you added
              manually.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearing || appointments.length === 0}
            className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {clearing ? 'Clearing…' : 'Clear all'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-gray-700 font-medium">Filter by status:</span>
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full border text-xs ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ),
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              No bookings found for this filter.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600 font-semibold">
                    Date & time
                  </th>
                  <th className="px-4 py-2 text-left text-gray-600 font-semibold">
                    Service
                  </th>
                  <th className="px-4 py-2 text-left text-gray-600 font-semibold">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-left text-gray-600 font-semibold">
                    Phone
                  </th>
                  <th className="px-4 py-2 text-left text-gray-600 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => {
                  const dt = new Date(a.start_time)
                  const label = dt.toLocaleString()
                  const serviceName =
                    a.service_name ||
                    (a.service_id && servicesMap[a.service_id]) ||
                    'Unknown service'
                  return (
                    <tr key={a.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 whitespace-nowrap">{label}</td>
                      <td className="px-4 py-2">{serviceName}</td>
                      <td className="px-4 py-2">
                        {a.customer_name || 'Walk‑in / unknown'}
                      </td>
                      <td className="px-4 py-2">
                        {a.customer_phone || '—'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={a.status}
                            disabled={updatingId === a.id}
                            onChange={async (e) => {
                              const nextStatus = e.target.value
                              setUpdatingId(a.id)
                              try {
                                await api.updateAppointmentStatus(a.id, nextStatus)
                                setAppointments((prev) =>
                                  prev.map((ap) =>
                                    ap.id === a.id ? { ...ap, status: nextStatus } : ap,
                                  ),
                                )
                              } catch (err) {
                                console.error('Failed to update appointment status', err)
                              } finally {
                                setUpdatingId(null)
                              }
                            }}
                            className="border border-gray-300 rounded-md text-xs px-2 py-1 bg-white"
                          >
                            {['pending', 'confirmed', 'completed', 'cancelled'].map(
                              (status) => (
                                <option key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                              ),
                            )}
                          </select>
                          {a.status === 'pending' && (
                            <div className="flex gap-1">
                              <button
                                onClick={async () => {
                                  setUpdatingId(a.id)
                                  try {
                                    await api.updateAppointmentStatus(a.id, 'confirmed')
                                    setAppointments((prev) =>
                                      prev.map((ap) =>
                                        ap.id === a.id ? { ...ap, status: 'confirmed' } : ap,
                                      ),
                                    )
                                  } catch (err) {
                                    console.error('Failed to confirm appointment', err)
                                  } finally {
                                    setUpdatingId(null)
                                  }
                                }}
                                disabled={updatingId === a.id}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm('Cancel this booking?')) {
                                    setUpdatingId(a.id)
                                    try {
                                      await api.updateAppointmentStatus(a.id, 'cancelled')
                                      setAppointments((prev) =>
                                        prev.map((ap) =>
                                          ap.id === a.id ? { ...ap, status: 'cancelled' } : ap,
                                        ),
                                      )
                                    } catch (err) {
                                      console.error('Failed to cancel appointment', err)
                                    } finally {
                                      setUpdatingId(null)
                                    }
                                  }
                                }}
                                disabled={updatingId === a.id}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          {a.status === 'confirmed' && (
                            <button
                              onClick={async () => {
                                setUpdatingId(a.id)
                                try {
                                  await api.updateAppointmentStatus(a.id, 'completed')
                                  setAppointments((prev) =>
                                    prev.map((ap) =>
                                      ap.id === a.id ? { ...ap, status: 'completed' } : ap,
                                    ),
                                  )
                                } catch (err) {
                                  console.error('Failed to complete appointment', err)
                                } finally {
                                  setUpdatingId(null)
                                }
                              }}
                              disabled={updatingId === a.id}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
