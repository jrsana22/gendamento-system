'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime, STATUS_LABELS, NOTIF_LABELS, NOTIF_STATUS_LABELS } from '@/lib/utils'
import { Plus, Calendar, ChevronDown, ChevronUp, Trash2, Search, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: string
  scheduledAt: string
  sentAt: string | null
  status: string
}

interface Appointment {
  id: string
  title: string
  customerName: string
  customerPhone: string
  scheduledAt: string
  notes: string | null
  status: string
  notifications: Notification[]
}

const statusVariant: Record<string, 'blue' | 'green' | 'red'> = {
  SCHEDULED: 'blue', DONE: 'green', CANCELLED: 'red',
}
const notifVariant: Record<string, 'yellow' | 'green' | 'red'> = {
  PENDING: 'yellow', SENT: 'green', FAILED: 'red',
}

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchAppointments = useCallback(async () => {
    const res = await fetch('/api/appointments')
    const data = await res.json()
    setAppointments(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o agendamento de "${name}"?`)) return
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Agendamento excluído')
      fetchAppointments()
    } else {
      toast.error('Erro ao excluir')
    }
  }

  const filtered = appointments.filter((a) => {
    const matchSearch =
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.customerPhone.includes(search)
    const d = new Date(a.scheduledAt)
    const matchFrom = !dateFrom || d >= new Date(dateFrom)
    const matchTo = !dateTo || d <= new Date(dateTo + 'T23:59:59')
    return matchSearch && matchFrom && matchTo
  })
  const upcoming = filtered.filter((a) => a.status === 'SCHEDULED' && new Date(a.scheduledAt) >= new Date())
  const past = filtered.filter((a) => a.status !== 'SCHEDULED' || new Date(a.scheduledAt) < new Date())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agendamentos</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Gerencie seus encontros e lembretes automáticos</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <a href="/api/appointments/export" download className="hidden sm:block">
            <Button variant="secondary" size="sm"><Download className="h-4 w-4" /><span className="hidden sm:inline"> Exportar</span></Button>
          </a>
          <Link href="/dashboard/agendamentos/novo">
            <Button size="sm"><Plus className="h-4 w-4" /><span className="hidden xs:inline"> Novo</span></Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1 py-2 px-3 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="De"
          />
          <span className="text-gray-400 dark:text-slate-500 text-sm flex-shrink-0">até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex-1 py-2 px-3 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Até"
          />
          {(search || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}
              className="flex-shrink-0 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 font-medium"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 dark:text-slate-500">Carregando...</div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-500">
          <Calendar className="h-12 w-12 mb-3" />
          <p>Nenhum agendamento ainda</p>
          <Link href="/dashboard/agendamentos/novo">
            <Button className="mt-4" size="sm"><Plus className="h-4 w-4" /> Criar primeiro</Button>
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <ApptSection title="Próximos" appointments={upcoming} expanded={expanded}
              setExpanded={setExpanded} onDelete={handleDelete}
              statusVariant={statusVariant} notifVariant={notifVariant} />
          )}
          {past.length > 0 && (
            <ApptSection title="Histórico" appointments={past} expanded={expanded}
              setExpanded={setExpanded} onDelete={handleDelete}
              statusVariant={statusVariant} notifVariant={notifVariant} />
          )}
        </>
      )}
    </div>
  )
}

function ApptSection({ title, appointments, expanded, setExpanded, onDelete, statusVariant, notifVariant }: {
  title: string
  appointments: Appointment[]
  expanded: string | null
  setExpanded: (id: string | null) => void
  onDelete: (id: string, name: string) => void
  statusVariant: Record<string, 'blue' | 'green' | 'red'>
  notifVariant: Record<string, 'yellow' | 'green' | 'red'>
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{title}</h2>
      {appointments.map((appt) => (
        <div key={appt.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden w-full">
          <div className="px-4 py-3.5 space-y-2.5">

            {/* Linha 1: nome + status + expand */}
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white leading-tight truncate">{appt.customerName}</p>
                <div className="mt-1">
                  <Badge variant={statusVariant[appt.status] ?? 'gray'}>
                    {STATUS_LABELS[appt.status] ?? appt.status}
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => setExpanded(expanded === appt.id ? null : appt.id)}
                className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {expanded === appt.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {/* Linha 2: título */}
            <p className="text-sm text-gray-600 dark:text-slate-400 truncate">{appt.title}</p>

            {/* Linha 3: data e lembretes */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
              <span className="font-medium text-gray-800 dark:text-slate-200">{formatDateTime(appt.scheduledAt)}</span>
              <span>{appt.notifications.filter((n) => n.status === 'SENT').length}/{appt.notifications.length} lembretes</span>
            </div>

            {/* Linha 4: telefone + excluir */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{appt.customerPhone}</p>
              <button onClick={() => onDelete(appt.id, appt.customerName)} title="Excluir"
                className="h-7 w-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex-shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Lembretes expandidos */}
          {expanded === appt.id && (
            <div className="border-t border-gray-100 dark:border-slate-800 px-4 py-4 bg-gray-50 dark:bg-slate-800/50 space-y-3">
              {appt.notes && (
                <p className="text-sm text-gray-600 dark:text-slate-300 break-words"><span className="font-medium">Obs:</span> {appt.notes}</p>
              )}
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Lembretes automáticos</p>
              <div className="space-y-2">
                {appt.notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-slate-500">Nenhum lembrete agendado</p>
                ) : (
                  appt.notifications.map((n) => (
                    <div key={n.id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{NOTIF_LABELS[n.type]}</span>
                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{formatDateTime(n.scheduledAt)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant={notifVariant[n.status] ?? 'gray'}>
                          {NOTIF_STATUS_LABELS[n.status]}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
