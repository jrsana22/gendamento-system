'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { formatDateTime, STATUS_LABELS, NOTIF_LABELS, NOTIF_STATUS_LABELS } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Calendar, Search, Users, Download } from 'lucide-react'

interface Notification {
  id: string
  type: string
  status: string
}

interface Appointment {
  id: string
  customerName: string
  customerPhone: string
  title: string
  scheduledAt: string
  status: string
  clientId: string
  client: { name: string }
  notifications: Notification[]
}

const statusVariant: Record<string, 'blue' | 'green' | 'red'> = {
  SCHEDULED: 'blue', DONE: 'green', CANCELLED: 'red',
}
const notifStatusVariant: Record<string, 'yellow' | 'green' | 'red'> = {
  PENDING: 'yellow', SENT: 'green', FAILED: 'red',
}

export default function AdminAgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchAppointments = useCallback(async () => {
    const res = await fetch('/api/admin/appointments')
    const data = await res.json()
    setAppointments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const agents = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of appointments) {
      if (a.clientId && a.client?.name) map.set(a.clientId, a.client.name)
    }
    return Array.from(map.entries()).sort(([, a], [, b]) => a.localeCompare(b))
  }, [appointments])

  const filtered = appointments.filter((a) => {
    const matchAgent = agentFilter === 'all' || a.clientId === agentFilter
    const matchSearch =
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.customerPhone.includes(search)
    const d = new Date(a.scheduledAt)
    const matchFrom = !dateFrom || d >= new Date(dateFrom)
    const matchTo = !dateTo || d <= new Date(dateTo + 'T23:59:59')
    return matchAgent && matchSearch && matchFrom && matchTo
  })

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Todos os Agendamentos</h1>
          <p className="text-gray-500 mt-1">
            {agentFilter === 'all'
              ? `${appointments.length} agendamentos · todos os agentes`
              : `${agents.find(([id]) => id === agentFilter)?.[1]} · ${filtered.length} agendamentos`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <a href="/api/admin/appointments/export" download>
          <button className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 font-medium text-gray-600">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </a>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
          >
            <option value="all">Todos os agentes</option>
            {agents.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" title="De" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" title="Até" />

        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Calendar className="h-12 w-12 mb-3" />
          <p>Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => (
            <div key={appt.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{appt.customerName}</h3>
                    <Badge variant={statusVariant[appt.status] ?? 'gray'}>
                      {STATUS_LABELS[appt.status] ?? appt.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{appt.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-400">Tel: {appt.customerPhone}</p>
                    {agentFilter === 'all' && (
                      <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">
                        {appt.client.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatDateTime(appt.scheduledAt)}</p>
                </div>
              </div>

              {appt.notifications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {appt.notifications.map((n) => (
                    <div key={n.id} className="flex items-center gap-1.5 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
                      <span className="font-medium text-gray-700">{NOTIF_LABELS[n.type]}</span>
                      <Badge variant={notifStatusVariant[n.status] ?? 'gray'}>
                        {NOTIF_STATUS_LABELS[n.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
