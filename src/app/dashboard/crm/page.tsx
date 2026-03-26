'use client'

import { useEffect, useState, useCallback } from 'react'
import { Phone, User, Search, ChevronDown, ChevronUp, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Appointment {
  id: string
  title: string
  customerName: string
  customerPhone: string
  scheduledAt: string
  notes?: string
  status: string
}

const COLUMNS = [
  { key: 'SCHEDULED', label: 'Agendado', color: 'blue' },
  { key: 'DONE', label: 'Compareceu', color: 'green' },
  { key: 'CANCELLED', label: 'Não compareceu', color: 'red' },
  { key: 'CONSULTANT', label: 'Consultor Cadastrado', color: 'purple' },
]

const colStyle: Record<string, string> = {
  blue:   'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
  green:  'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
  red:    'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
  purple: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900',
}

const headerStyle: Record<string, string> = {
  blue:   'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  green:  'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  red:    'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
}

const badgeStyle: Record<string, string> = {
  SCHEDULED:  'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
  DONE:       'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300',
  CANCELLED:  'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300',
  CONSULTANT: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
}

const dateGroupStyle: Record<string, string> = {
  blue:   'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
  green:  'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200',
  red:    'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200',
  purple: 'bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
}

function formatDateGroup(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

function groupByDate(appointments: Appointment[]) {
  const groups: Record<string, Appointment[]> = {}
  for (const appt of appointments) {
    const d = new Date(appt.scheduledAt)
    const key = d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    if (!groups[key]) groups[key] = []
    groups[key].push(appt)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

const INITIAL_SHOW = 5

export default function CRMPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState(0)
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [editForm, setEditForm] = useState({ title: '', customerName: '', customerPhone: '', scheduledAt: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const fetchAppointments = useCallback(async () => {
    const res = await fetch('/api/appointments')
    const data = await res.json()
    setAppointments(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  function openEdit(appt: Appointment) {
    const localDT = new Date(appt.scheduledAt).toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T').slice(0, 16)
    setEditForm({ title: appt.title, customerName: appt.customerName, customerPhone: appt.customerPhone, scheduledAt: localDT, notes: appt.notes || '' })
    setEditingAppt(appt)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingAppt) return
    setSaving(true)
    const res = await fetch(`/api/appointments/${editingAppt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, scheduledAt: new Date(editForm.scheduledAt).toISOString() }),
    })
    setSaving(false)
    if (res.ok) { toast.success('Agendamento atualizado'); setEditingAppt(null); fetchAppointments() }
    else { const d = await res.json(); toast.error(d.error || 'Erro ao atualizar') }
  }

  async function moveCard(id: string, newStatus: string) {
    setMoving(id)
    await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    await fetchAppointments()
    setMoving(null)
  }

  const filtered = appointments.filter((a) =>
    a.customerName.toLowerCase().includes(search.toLowerCase()) ||
    a.customerPhone.includes(search)
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 dark:text-slate-500">Carregando...</div>
  }

  return (
    <>
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acompanhamento de Leads</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Acompanhe o status dos seus contatos</p>
        </div>
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex md:hidden border-b border-gray-200 dark:border-slate-800 overflow-x-auto">
        {COLUMNS.map((col, i) => {
          const count = filtered.filter(a => a.status === col.key).length
          return (
            <button
              key={col.key}
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'
              }`}
            >
              {col.label} <span className="ml-1 text-xs font-bold">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Desktop: 4 columns | Mobile: active tab only */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const cards = filtered.filter((a) => a.status === col.key)
          const others = COLUMNS.filter((c) => c.key !== col.key)
          const groups = groupByDate(cards)
          const colKey = col.key
          const isExpanded = expanded[colKey]
          const totalGroups = groups.length

          // Flatten all cards to count
          const allCards = groups.flatMap(([, c]) => c)
          const visibleGroups = isExpanded ? groups : (() => {
            let count = 0
            const result: typeof groups = []
            for (const [date, items] of groups) {
              if (count >= INITIAL_SHOW) break
              const take = Math.min(items.length, INITIAL_SHOW - count)
              result.push([date, items.slice(0, take)])
              count += take
            }
            return result
          })()
          const hiddenCount = allCards.length - visibleGroups.flatMap(([, c]) => c).length

          return (
            <div key={col.key} className={`rounded-xl border-2 ${colStyle[col.color]} flex flex-col`}>
              <div className={`rounded-t-xl px-4 py-3 flex items-center justify-between ${headerStyle[col.color]}`}>
                <span className="font-semibold text-sm">{col.label}</span>
                <span className="text-xs font-bold bg-white dark:bg-slate-900 bg-opacity-60 rounded-full px-2 py-0.5">
                  {cards.length}
                </span>
              </div>

              <div className="flex flex-col gap-2 p-3 flex-1">
                {cards.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">Nenhum contato</p>
                )}

                {visibleGroups.map(([dateKey, items]) => (
                  <div key={dateKey}>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-md mb-1 ${dateGroupStyle[col.color]}`}>
                      {formatDateGroup(dateKey + 'T12:00:00')}
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((appt) => (
                        <div key={appt.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                              {appt.customerName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            {appt.customerPhone}
                          </div>
                          {appt.notes && (
                            <p className="text-xs text-gray-400 dark:text-slate-500 italic truncate">{appt.notes}</p>
                          )}
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100 dark:border-slate-800">
                            <button onClick={() => openEdit(appt)} className="text-xs px-2 py-1 rounded-md font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center gap-1">
                              <Pencil className="h-3 w-3" /> Editar
                            </button>
                            {others.map((o) => {
                              const currentIdx = COLUMNS.findIndex(c => c.key === col.key)
                              const targetIdx = COLUMNS.findIndex(c => c.key === o.key)
                              const arrow = targetIdx < currentIdx ? '←' : '→'
                              return (
                                <button
                                  key={o.key}
                                  disabled={moving === appt.id}
                                  onClick={() => moveCard(appt.id, o.key)}
                                  className={`text-xs px-2 py-1 rounded-md font-medium transition-opacity ${badgeStyle[o.key]} hover:opacity-80 disabled:opacity-40`}
                                >
                                  {arrow} {o.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {allCards.length > INITIAL_SHOW && (
                  <button
                    onClick={() => setExpanded(e => ({ ...e, [colKey]: !isExpanded }))}
                    className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300 py-1 font-medium"
                  >
                    {isExpanded
                      ? <><ChevronUp className="h-3 w-3" /> Ocultar</>
                      : <><ChevronDown className="h-3 w-3" /> +{hiddenCount} mais</>
                    }
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: single active column */}
      {COLUMNS.map((col, i) => {
        if (i !== activeTab) return null
        const cards = filtered.filter((a) => a.status === col.key)
        const others = COLUMNS.filter((c) => c.key !== col.key)
        const groups = groupByDate(cards)

        return (
          <div key={col.key} className={`md:hidden rounded-xl border-2 ${colStyle[col.color]}`}>
            <div className="flex flex-col gap-2 p-3">
              {cards.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">Nenhum contato nesta coluna</p>
              )}
              {groups.map(([dateKey, items]) => (
                <div key={dateKey}>
                  <div className={`text-xs font-semibold px-2 py-1 rounded-md mb-1 ${dateGroupStyle[col.color]}`}>
                    {formatDateGroup(dateKey + 'T12:00:00')}
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((appt) => (
                      <div key={appt.id} className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{appt.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {appt.customerPhone}
                        </div>
                        {appt.notes && <p className="text-xs text-gray-400 dark:text-slate-500 italic truncate">{appt.notes}</p>}
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100 dark:border-slate-800">
                          <button onClick={() => openEdit(appt)} className="text-xs px-2 py-1 rounded-md font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 flex items-center gap-1">
                            <Pencil className="h-3 w-3" /> Editar
                          </button>
                          {others.map((o) => {
                            const currentIdx = COLUMNS.findIndex(c => c.key === col.key)
                            const targetIdx = COLUMNS.findIndex(c => c.key === o.key)
                            const arrow = targetIdx < currentIdx ? '←' : '→'
                            return (
                              <button
                                key={o.key}
                                disabled={moving === appt.id}
                                onClick={() => moveCard(appt.id, o.key)}
                                className={`text-xs px-2 py-1 rounded-md font-medium transition-opacity ${badgeStyle[o.key]} hover:opacity-80 disabled:opacity-40`}
                              >
                                {arrow} {o.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>

    {/* Modal de edição */}
    {editingAppt && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:border dark:border-slate-800">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Editar agendamento</h2>
            <button onClick={() => setEditingAppt(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleEdit} className="px-6 py-5 space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Título *</label>
              <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Nome *</label>
                <input value={editForm.customerName} onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })} required className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">WhatsApp *</label>
                <input value={editForm.customerPhone} onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })} required className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Data e horário *</label>
              <input type="datetime-local" value={editForm.scheduledAt} onChange={(e) => setEditForm({ ...editForm, scheduledAt: e.target.value })} required className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Observações</label>
              <textarea rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setEditingAppt(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  )
}
