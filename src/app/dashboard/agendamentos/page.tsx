'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { formatDateTime, STATUS_LABELS, NOTIF_LABELS, NOTIF_STATUS_LABELS } from '@/lib/utils'
import { Plus, Calendar, ChevronDown, ChevronUp, Trash2, CheckCircle, XCircle, Pencil, X, Search, Download } from 'lucide-react'
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
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [editForm, setEditForm] = useState({ title: '', customerName: '', customerPhone: '', scheduledAt: '', notes: '' })
  const [saving, setSaving] = useState(false)
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

  function openEdit(appt: Appointment) {
    const localDT = new Date(appt.scheduledAt).toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T').slice(0, 16)
    setEditForm({
      title: appt.title,
      customerName: appt.customerName,
      customerPhone: appt.customerPhone,
      scheduledAt: localDT,
      notes: appt.notes || '',
    })
    setEditingAppt(appt)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingAppt) return
    setSaving(true)

    const res = await fetch(`/api/appointments/${editingAppt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        scheduledAt: new Date(editForm.scheduledAt).toISOString(),
      }),
    })

    setSaving(false)
    if (res.ok) {
      toast.success('Agendamento atualizado')
      setEditingAppt(null)
      fetchAppointments()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Erro ao atualizar')
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success('Status atualizado')
      fetchAppointments()
    } else {
      toast.error('Erro ao atualizar')
    }
  }

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agendamentos</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Gerencie seus encontros e acompanhe os lembretes automáticos</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/appointments/export" download>
            <Button variant="secondary"><Download className="h-4 w-4" /> Exportar CSV</Button>
          </a>
          <Link href="/dashboard/agendamentos/novo">
            <Button><Plus className="h-4 w-4" /> Novo agendamento</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="De"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Até"
        />
        {(search || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}
            className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
          >
            Limpar
          </button>
        )}
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
              setExpanded={setExpanded} updateStatus={updateStatus}
              onDelete={handleDelete} onEdit={openEdit}
              statusVariant={statusVariant} notifVariant={notifVariant} />
          )}
          {past.length > 0 && (
            <ApptSection title="Histórico" appointments={past} expanded={expanded}
              setExpanded={setExpanded} updateStatus={updateStatus}
              onDelete={handleDelete} onEdit={openEdit}
              statusVariant={statusVariant} notifVariant={notifVariant} />
          )}
        </>
      )}

      {/* Modal de edição */}
      {editingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:border dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Editar agendamento</h2>
              <button onClick={() => setEditingAppt(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
              <Input label="Título *" value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Nome do cliente *" value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })} required />
                <Input label="WhatsApp" value={editForm.customerPhone}
                  onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })} required />
              </div>
              <Input label="Data e horário *" type="datetime-local" value={editForm.scheduledAt}
                onChange={(e) => setEditForm({ ...editForm, scheduledAt: e.target.value })} required />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Observações</label>
                <textarea rows={2} value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="secondary" onClick={() => setEditingAppt(null)}>Cancelar</Button>
                <Button type="submit" loading={saving}>Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function ApptSection({ title, appointments, expanded, setExpanded, updateStatus, onDelete, onEdit, statusVariant, notifVariant }: {
  title: string
  appointments: Appointment[]
  expanded: string | null
  setExpanded: (id: string | null) => void
  updateStatus: (id: string, status: string) => void
  onDelete: (id: string, name: string) => void
  onEdit: (appt: Appointment) => void
  statusVariant: Record<string, 'blue' | 'green' | 'red'>
  notifVariant: Record<string, 'yellow' | 'green' | 'red'>
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{title}</h2>
      {appointments.map((appt) => (
        <div key={appt.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 dark:text-white">{appt.customerName}</p>
                <Badge variant={statusVariant[appt.status] ?? 'gray'}>
                  {STATUS_LABELS[appt.status] ?? appt.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400">{appt.title}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{appt.customerPhone}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(appt.scheduledAt)}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  {appt.notifications.filter((n) => n.status === 'SENT').length}/
                  {appt.notifications.length} lembretes
                </p>
              </div>
              <div className="flex items-center gap-1">
                {appt.status === 'SCHEDULED' && (
                  <>
                    <Button size="sm" variant="ghost" title="Editar" onClick={() => onEdit(appt)}>
                      <Pencil className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Concluído" onClick={() => updateStatus(appt.id, 'DONE')}>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Cancelar" onClick={() => updateStatus(appt.id, 'CANCELLED')}>
                      <XCircle className="h-4 w-4 text-yellow-600" />
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => onDelete(appt.id, appt.customerName)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
                <Button size="sm" variant="ghost"
                  onClick={() => setExpanded(expanded === appt.id ? null : appt.id)}>
                  {expanded === appt.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {expanded === appt.id && (
            <div className="border-t border-gray-100 dark:border-slate-800 px-5 py-4 bg-gray-50 dark:bg-slate-800/50">
              {appt.notes && (
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-3"><span className="font-medium">Obs:</span> {appt.notes}</p>
              )}
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Lembretes automáticos</p>
              <div className="grid grid-cols-2 gap-2">
                {appt.notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-slate-500 col-span-2">Nenhum lembrete agendado</p>
                ) : (
                  appt.notifications.map((n) => (
                    <div key={n.id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{NOTIF_LABELS[n.type]}</span>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{formatDateTime(n.scheduledAt)}</p>
                      </div>
                      <Badge variant={notifVariant[n.status] ?? 'gray'}>
                        {NOTIF_STATUS_LABELS[n.status]}
                      </Badge>
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
