'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { api, BusinessProfile } from '@/utils/api'
import { useTenant } from '@/hooks/useTenant'

type Complaint = {
  id: number
  tenant_id: number
  customer_id: number | null
  customer_name: string | null
  customer_phone: string | null
  complaint_details: string
  category: string | null
  priority: string
  status: string
  assigned_agent: string | null
  notes: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export default function ComplaintsPage() {
  const { tenantId, mounted } = useTenant()
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newComplaint, setNewComplaint] = useState({
    customer_name: '',
    customer_phone: '',
    complaint_details: '',
    category: 'General',
    priority: 'Medium'
  })

  const loadComplaints = async (tid: number) => {
    try {
      const [complaintsData, profileData] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/tenants/${tid}/complaints`).then(r => r.json()),
        api.getBusinessProfile(tid),
      ])
      setComplaints(complaintsData || [])
      setProfile(profileData || null)
    } catch (err) {
      console.error('Failed to load complaints', err)
    }
  }

  useEffect(() => {
    if (!mounted) return
    if (!tenantId) {
      router.replace('/login')
      return
    }

    const setup = async () => {
      try {
        await loadComplaints(tenantId)
      } catch (err) {
        console.error('Failed to load complaints data', err)
      } finally {
        setLoading(false)
      }
    }

    setup()

    // Poll for updates every 10 seconds
    const intervalId = window.setInterval(() => {
      loadComplaints(tenantId)
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [tenantId, mounted, router])

  const filteredComplaints = useMemo(() => {
    let filtered = complaints
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status.toLowerCase() === statusFilter.toLowerCase())
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((c) => c.priority.toLowerCase() === priorityFilter.toLowerCase())
    }
    return filtered
  }, [complaints, statusFilter, priorityFilter])

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/tenants/${tenantId}/complaints`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newComplaint)
        }
      )
      
      if (response.ok) {
        const createdComplaint = await response.json()
        setComplaints(prev => [createdComplaint, ...prev])
        setNewComplaint({
          customer_name: '',
          customer_phone: '',
          complaint_details: '',
          category: 'General',
          priority: 'Medium'
        })
        setShowCreateForm(false)
      }
    } catch (err) {
      console.error('Failed to create complaint', err)
    }
  }

  const handleUpdateComplaint = async (complaintId: number, field: string, value: string) => {
    setUpdatingId(complaintId)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/complaints/${complaintId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value })
        }
      )
      
      if (response.ok) {
        const updatedComplaint = await response.json()
        setComplaints(prev => 
          prev.map(c => c.id === complaintId ? updatedComplaint : c)
        )
      }
    } catch (err) {
      console.error('Failed to update complaint', err)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading complaints…</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return 'text-green-600 bg-green-50'
      case 'in-progress': return 'text-blue-600 bg-blue-50'
      case 'escalated': return 'text-red-600 bg-red-50'
      case 'reopened': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'text-red-700 bg-red-100'
      case 'high': return 'text-orange-700 bg-orange-100'
      case 'medium': return 'text-yellow-700 bg-yellow-100'
      case 'low': return 'text-green-700 bg-green-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Complaint Management{profile?.name ? ` – ${profile.name}` : ''}
            </h1>
            <p className="text-sm text-gray-600">
              Track and manage customer complaints and feedback.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Add Complaint
          </button>
        </div>

        {/* Create Complaint Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Create New Complaint</h3>
            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={newComplaint.customer_name}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, customer_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Phone
                  </label>
                  <input
                    type="text"
                    value={newComplaint.customer_phone}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, customer_phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newComplaint.category}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="General">General</option>
                    <option value="Service">Service</option>
                    <option value="Product Quality">Product Quality</option>
                    <option value="Booking Issue">Booking Issue</option>
                    <option value="Delay">Delay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newComplaint.priority}
                    onChange={(e) => setNewComplaint(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complaint Details *
                </label>
                <textarea
                  value={newComplaint.complaint_details}
                  onChange={(e) => setNewComplaint(prev => ({ ...prev, complaint_details: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Describe the complaint in detail..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Create Complaint
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-700 font-medium">Filter by:</span>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Status:</span>
            {['all', 'pending', 'in-progress', 'resolved', 'escalated', 'reopened'].map((status) => (
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
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600">Priority:</span>
            {['all', 'low', 'medium', 'high', 'critical'].map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => setPriorityFilter(priority)}
                className={`px-3 py-1 rounded-full border text-xs ${
                  priorityFilter === priority
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredComplaints.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              No complaints found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold">Details</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold">Category</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold">Priority</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((complaint) => {
                    const createdDate = new Date(complaint.created_at)
                    return (
                      <tr key={complaint.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {createdDate.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">
                              {complaint.customer_name || 'Unknown'}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {complaint.customer_phone || '—'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="truncate" title={complaint.complaint_details}>
                            {complaint.complaint_details}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                            {complaint.category || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <select
                              value={complaint.status}
                              disabled={updatingId === complaint.id}
                              onChange={(e) => handleUpdateComplaint(complaint.id, 'status', e.target.value)}
                              className="border border-gray-300 rounded text-xs px-2 py-1 bg-white"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In-Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Escalated">Escalated</option>
                              <option value="Reopened">Reopened</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-900">
              {complaints.length}
            </div>
            <div className="text-sm text-gray-600">Total Complaints</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-red-600">
              {complaints.filter(c => c.status === 'Pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-blue-600">
              {complaints.filter(c => c.status === 'In-Progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">
              {complaints.filter(c => c.status === 'Resolved').length}
            </div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
        </div>
      </div>
    </div>
  )
}