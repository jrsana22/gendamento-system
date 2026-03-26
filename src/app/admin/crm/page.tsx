'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Phone, User, Search, ChevronDown, ChevronUp, Users } from 'lucide-react'

interface Appointment {
  id: string
  title: string
  customerName: string
  customerPhone: string
  scheduledAt: string
  notes?: string
  status: string
  clientId: string
  client?: { name: string }
}

const COLUMNS = [
  { key: 'SCHEDULED', label: 'Agendado', color: 'blue' },
  { key: 'DONE', label: 'Compareceu', color: 'green' },
  { key: 'CANCELLED', label: 'Não compareceu', color: 'red' },
  { key: 'CONSULTANT', label: 'Consultor Cadastrado', color: 'purple' },
]

const colStyle: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  red: 'bg-red-50 border-red-200',
  purple: 'bg-purple-50 border-purple-200',
}
const headerStyle: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
}
const badgeStyle: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  CONSULTANT: 'bg-purple-100 text-purple-700',
}
const dateGroupStyle: Record<string, string> = {
  blue: 'bg-blue-200 text-blue-800',
  green: 'bg-green-200 text-green-800',
  red: 'bg-red-200 text-red-800',
  purple: 'bg-purple-200 text-purple-800',
}

function formatDateGroup(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

function groupByDate(appointments: Appointment[]) {
  const groups: Record<string, Appointment[]> = {}
  for (const appt of appointments) {
    const key = new Date(appt.scheduledAt).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    if (!groups[key]) groups[key] = []
    groups[key].push(appt)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

const INITIAL_SHOW = 5

export default function AdminCRMPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchAppointments = useCallback(async () => {
    const res = await fetch('/api/admin/appointments')
    const data = await res.json()
    setAppointments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  // Derive agent list from data
  const agents = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of appointments) {
      if (a.clientId && a.client?.name) map.set(a.clientId, a.client.name)
    }
    return Array.from(map.entries()).sort(([, a], [, b]) => a.localeCompare(b))
  }, [appointments])

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

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 dark:text-slate-500">Carregando...</div>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acompanhamento de Leads</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            {agentFilter === 'all'
              ? `Todos os agentes · ${appointments.length} leads`
              : `${agents.find(([id]) => id === agentFilter)?.[1]} · ${filtered.length} leads`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {/* Agent filter */}
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 appearance-none"
          >
            <option value="all">Todos os agentes</option>
            {agents.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        {/* Date filters */}
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" title="De" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" title="Até" />

        {/* Search */}
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex md:hidden border-b border-gray-200 dark:border-slate-800 overflow-x-auto">
        {COLUMNS.map((col, i) => {
          const count = filtered.filter(a => a.status === col.key).length
          return (
            <button key={col.key} onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === i ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 dark:text-slate-400'}`}>
              {col.label} <span className="ml-1 text-xs font-bold">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Kanban desktop */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const cards = filtered.filter((a) => a.status === col.key)
          const others = COLUMNS.filter((c) => c.key !== col.key)
          const groups = groupByDate(cards)
          const colKey = col.key
          const isExpanded = expanded[colKey]
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
                        <div key={appt.id} className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm p-3 space-y-2">
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
                          {/* Agent badge — only when showing all agents */}
                          {agentFilter === 'all' && appt.client?.name && (
                            <div className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md truncate">
                              {appt.client.name}
                            </div>
                          )}
                          {appt.notes && (
                            <p className="text-xs text-gray-400 dark:text-slate-500 italic truncate">{appt.notes}</p>
                          )}
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100 dark:border-slate-800">
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
              {cards.length === 0 && <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">Nenhum contato</p>}
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
                          <Phone className="h-3 w-3 flex-shrink-0" />{appt.customerPhone}
                        </div>
                        {agentFilter === 'all' && appt.client?.name && (
                          <div className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">{appt.client.name}</div>
                        )}
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100 dark:border-slate-800">
                          {others.map((o) => {
                            const arrow = COLUMNS.findIndex(c => c.key === o.key) < COLUMNS.findIndex(c => c.key === col.key) ? '←' : '→'
                            return (
                              <button key={o.key} disabled={moving === appt.id} onClick={() => moveCard(appt.id, o.key)}
                                className={`text-xs px-2 py-1 rounded-md font-medium ${badgeStyle[o.key]} hover:opacity-80 disabled:opacity-40`}>
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
  )
}
