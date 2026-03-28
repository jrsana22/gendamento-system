'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Phone, Search, GripVertical, Archive, ChevronRight,
  Trash2, Pencil, X, RotateCcw, Calendar, Bell,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface Notif {
  id: string
  status: string
}

interface Appointment {
  id: string
  title: string
  customerName: string
  customerPhone: string
  scheduledAt: string
  notes?: string
  status: string
  notifications: Notif[]
}

const COLUMNS = [
  { key: 'SCHEDULED', label: 'Agendado',        color: 'blue'  },
  { key: 'DONE',      label: 'Compareceu',       color: 'green' },
  { key: 'CANCELLED', label: 'Não compareceu',   color: 'red'   },
]

const colStyle: Record<string, string> = {
  blue:  'bg-blue-100 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800',
  green: 'bg-green-100 dark:bg-green-950/50 border-green-300 dark:border-green-800',
  red:   'bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-800',
}

const colStyleOver: Record<string, string> = {
  blue:  'bg-blue-200 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600',
  green: 'bg-green-200 dark:bg-green-950/70 border-green-400 dark:border-green-600',
  red:   'bg-red-200 dark:bg-red-950/70 border-red-400 dark:border-red-600',
}

const headerStyle: Record<string, string> = {
  blue:  'bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300',
  green: 'bg-green-200 dark:bg-green-900/60 text-green-800 dark:text-green-300',
  red:   'bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-300',
}

const moveChipStyle: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60',
  DONE:      'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60',
  CANCELLED: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60',
}

const dateGroupStyle: Record<string, string> = {
  blue:  'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
  green: 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200',
  red:   'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200',
}

const MOVE_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendado',
  DONE:      'Compareceu',
  CANCELLED: 'Não compareceu',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
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

/** Calcula a próxima quinta-feira às 09:00 (horário de Brasília) */
function nextThursdayAt9(): Date {
  const now = new Date()
  const sp = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const day = sp.getDay() // 0=Dom … 4=Qui

  let daysAhead: number
  if (day === 4) {
    const h = sp.getHours(), m = sp.getMinutes()
    daysAhead = (h < 9 || (h === 9 && m < 15)) ? 0 : 7
  } else if (day < 4) {
    daysAhead = 4 - day
  } else {
    daysAhead = 4 + 7 - day
  }

  const thursday = new Date(sp)
  thursday.setDate(sp.getDate() + daysAhead)
  thursday.setHours(9, 0, 0, 0)
  return thursday
}

const INITIAL_SHOW = 5

// ── Kanban Card ────────────────────────────────────────────────
function KanbanCard({
  appt, col, others, moving, onEdit, onMove, onDelete, onReinvite, overlay = false,
}: {
  appt: Appointment
  col: typeof COLUMNS[0]
  others: typeof COLUMNS
  moving: string | null
  onEdit: (a: Appointment) => void
  onMove: (id: string, status: string) => void
  onDelete: (id: string, name: string) => void
  onReinvite: (a: Appointment) => void
  overlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: appt.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging && !overlay ? 0.3 : 1,
    touchAction: 'none' as const,
  }

  const sentCount = appt.notifications.filter(n => n.status === 'SENT').length
  const totalCount = appt.notifications.length
  const hasMissed = appt.notifications.some(n => n.status === 'FAILED')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden transition-shadow select-none ${
        overlay ? 'shadow-2xl rotate-1 scale-105' : ''
      }`}
    >
      {/* Card body — área de drag (pressionar e arrastar) */}
      <div
        {...listeners}
        {...attributes}
        className="p-3 space-y-1.5 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex-shrink-0 text-gray-300 dark:text-slate-600">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
              {appt.customerName}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
              <Phone className="h-3 w-3 flex-shrink-0" />
              {appt.customerPhone}
            </p>
          </div>
        </div>

        {/* Date + notifications badge */}
        <div className="flex items-center justify-between text-xs pl-6">
          <span className="flex items-center gap-1 text-gray-400 dark:text-slate-500">
            <Calendar className="h-3 w-3" />
            {formatDate(appt.scheduledAt)}
          </span>
          <span className={`flex items-center gap-1 font-medium ${
            hasMissed
              ? 'text-amber-400 dark:text-amber-500'
              : totalCount === 0
                ? 'text-gray-300 dark:text-slate-600'
                : 'text-gray-400 dark:text-slate-500'
          }`}>
            <Bell className="h-3 w-3" />
            {sentCount}/{totalCount}
          </span>
        </div>

        {appt.notes && (
          <p className="text-xs text-gray-400 dark:text-slate-500 italic truncate pl-6">{appt.notes}</p>
        )}
      </div>

      {/* Action bar */}
      {!overlay && (
        <div className="border-t border-gray-100 dark:border-slate-800 px-2 py-1.5 flex flex-wrap gap-1 items-center">
          {/* Edit */}
          <button
            onClick={() => onEdit(appt)}
            className="text-xs px-2 py-1 rounded-md font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" /> Editar
          </button>

          {/* Arrow move buttons */}
          {others.map((o) => {
            const currentIdx = COLUMNS.findIndex(c => c.key === col.key)
            const targetIdx  = COLUMNS.findIndex(c => c.key === o.key)
            const arrow = targetIdx < currentIdx ? '←' : '→'
            return (
              <button
                key={o.key}
                disabled={moving === appt.id}
                onClick={() => onMove(appt.id, o.key)}
                className={`text-xs px-2 py-1 rounded-md font-medium transition-opacity disabled:opacity-40 hover:opacity-80 ${moveChipStyle[o.key]}`}
              >
                {arrow} {MOVE_LABEL[o.key]}
              </button>
            )
          })}

          {/* Novo convite — só no CANCELLED */}
          {col.key === 'CANCELLED' && (
            <button
              onClick={() => onReinvite(appt)}
              title="Novo convite (próxima quinta)"
              className="text-xs px-2 py-1 rounded-md font-medium bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:opacity-80 flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Novo convite
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => onDelete(appt.id, appt.customerName)}
            title="Excluir"
            className="ml-auto text-xs px-2 py-1 rounded-md font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Droppable Column ────────────────────────────────────────────
function DroppableColumn({
  col, cards, moving, expanded, onToggleExpand, onEdit, onMove, onDelete, onReinvite,
}: {
  col: typeof COLUMNS[0]
  cards: Appointment[]
  moving: string | null
  expanded: boolean
  onToggleExpand: () => void
  onEdit: (a: Appointment) => void
  onMove: (id: string, status: string) => void
  onDelete: (id: string, name: string) => void
  onReinvite: (a: Appointment) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })
  const others = COLUMNS.filter(c => c.key !== col.key)
  const groups = groupByDate(cards)

  const visibleGroups = expanded ? groups : (() => {
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

  const hiddenCount = cards.length - visibleGroups.flatMap(([, c]) => c).length

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 flex flex-col transition-all duration-150 min-h-[200px] ${
        isOver ? colStyleOver[col.color] : colStyle[col.color]
      }`}
    >
      {/* Header */}
      <div className={`rounded-t-xl px-4 py-3 flex items-center justify-between ${headerStyle[col.color]}`}>
        <span className="font-semibold text-sm">{col.label}</span>
        <span className="text-xs font-bold bg-white dark:bg-slate-900 bg-opacity-60 rounded-full px-2 py-0.5">
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {cards.length === 0 && (
          <div className={`flex items-center justify-center py-10 rounded-xl border-2 border-dashed transition-colors ${
            isOver
              ? 'border-current opacity-50 bg-white/20 dark:bg-white/5'
              : 'border-gray-200 dark:border-slate-700'
          }`}>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              {isOver ? 'Solte aqui' : 'Nenhum contato'}
            </p>
          </div>
        )}

        {visibleGroups.map(([dateKey, items]) => (
          <div key={dateKey}>
            <div className={`text-xs font-semibold px-2 py-1 rounded-md mb-2 ${dateGroupStyle[col.color]}`}>
              {formatDateGroup(dateKey + 'T12:00:00')}
            </div>
            <div className="flex flex-col gap-2">
              {items.map((appt) => (
                <KanbanCard
                  key={appt.id}
                  appt={appt}
                  col={col}
                  others={others}
                  moving={moving}
                  onEdit={onEdit}
                  onMove={onMove}
                  onDelete={onDelete}
                  onReinvite={onReinvite}
                />
              ))}
            </div>
          </div>
        ))}

        {cards.length > INITIAL_SHOW && (
          <button
            onClick={onToggleExpand}
            className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 py-1 font-medium"
          >
            {expanded
              ? <><ChevronUp className="h-3 w-3" /> Ocultar</>
              : <><ChevronDown className="h-3 w-3" /> +{hiddenCount} mais</>
            }
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────
export default function CRMPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [editForm, setEditForm] = useState({ title: '', customerName: '', customerPhone: '', scheduledAt: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [draggedAppt, setDraggedAppt] = useState<Appointment | null>(null)
  const [archiveModal, setArchiveModal] = useState(false)
  const [archivingDate, setArchivingDate] = useState<string | null>(null)
  const appointmentsRef = useRef<Appointment[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } }),
  )

  const fetchAppointments = useCallback(async () => {
    const res = await fetch('/api/appointments')
    const data = await res.json()
    setAppointments(data)
    appointmentsRef.current = data
    setLoading(false)
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  // Auto-refresh a cada 20s — notifica novos leads
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/appointments')
        if (!res.ok) return
        const data: Appointment[] = await res.json()
        const currentIds = new Set(appointmentsRef.current.map(a => a.id))
        const newLeads = data.filter(a => !currentIds.has(a.id))
        if (newLeads.length > 0) {
          toast.success(
            newLeads.length === 1
              ? `🎉 Novo lead: ${newLeads[0].customerName}`
              : `🎉 ${newLeads.length} novos leads chegaram!`,
            { duration: 5000 }
          )
        }
        setAppointments(data)
        appointmentsRef.current = data
      } catch {
        // falha silenciosa — não interrompe UX
      }
    }, 20000)
    return () => clearInterval(interval)
  }, [])

  function openEdit(appt: Appointment) {
    const localDT = new Date(appt.scheduledAt)
      .toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' })
      .replace(' ', 'T')
      .slice(0, 16)
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
      body: JSON.stringify({ ...editForm, scheduledAt: new Date(editForm.scheduledAt).toISOString() }),
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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o lead "${name}"?`)) return
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Lead excluído')
      fetchAppointments()
    } else {
      toast.error('Erro ao excluir')
    }
  }

  async function handleReinvite(appt: Appointment) {
    const thursday = nextThursdayAt9()
    const dateLabel = thursday.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    })
    if (!confirm(`Criar novo convite para ${appt.customerName} na próxima quinta?\n${dateLabel} às 09:00`)) return

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: appt.title,
        customerName: appt.customerName,
        customerPhone: appt.customerPhone,
        scheduledAt: thursday.toISOString(),
      }),
    })
    if (res.ok) {
      toast.success(`Novo convite criado para ${appt.customerName}`)
      fetchAppointments()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Erro ao criar novo convite')
    }
  }

  async function moveCard(id: string, newStatus: string) {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    setMoving(id)
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      await fetchAppointments()
      toast.error('Erro ao mover card')
    }
    setMoving(null)
  }

  const meetingDates = Array.from(
    new Set(appointments.map(a =>
      new Date(a.scheduledAt).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    ))
  ).sort()

  async function archiveMeeting(date: string) {
    setArchivingDate(date)
    const res = await fetch('/api/appointments/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    })
    const data = await res.json()
    setArchivingDate(null)
    if (res.ok) {
      toast.success(`${data.archived} lead(s) arquivado(s)`)
      setArchiveModal(false)
      fetchAppointments()
    } else {
      toast.error('Erro ao arquivar')
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const appt = appointments.find(a => a.id === event.active.id)
    setDraggedAppt(appt ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setDraggedAppt(null)
    if (!over) return
    const appt = appointments.find(a => a.id === active.id)
    if (!appt) return
    const targetCol = COLUMNS.find(c => c.key === over.id)
    if (!targetCol || targetCol.key === appt.status) return
    moveCard(String(active.id), targetCol.key)
  }

  const filtered = appointments.filter(a =>
    a.customerName.toLowerCase().includes(search.toLowerCase()) ||
    a.customerPhone.includes(search)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-slate-500">
        Carregando...
      </div>
    )
  }

  return (
    <>
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acompanhamento de Leads</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Acompanhe o status dos seus contatos</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-44 sm:w-52 pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setArchiveModal(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
          >
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">Arquivar encontro</span>
          </button>
        </div>
      </div>

      {/*
        Kanban unificado:
        • Mobile: scroll horizontal com snap (colunas 88vw = peek da próxima visível)
        • Desktop: grid 3 colunas
        O TouchSensor do dnd-kit permite arrastar no mobile (pressionar 250ms + mover).
      */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory
                      md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className="w-[88vw] min-w-[280px] flex-shrink-0 snap-start
                       md:w-auto md:min-w-0 md:flex-none"
          >
            <DroppableColumn
              col={col}
              cards={filtered.filter(a => a.status === col.key)}
              moving={moving}
              expanded={!!expanded[col.key]}
              onToggleExpand={() => setExpanded(e => ({ ...e, [col.key]: !e[col.key] }))}
              onEdit={openEdit}
              onMove={moveCard}
              onDelete={handleDelete}
              onReinvite={handleReinvite}
            />
          </div>
        ))}
      </div>

      {/* Dica mobile */}
      <p className="text-center text-xs text-gray-400 dark:text-slate-600 md:hidden">
        Deslize para ver as colunas · Pressione e arraste para mover cards
      </p>
    </div>

    {/* Drag overlay — card flutuante ao arrastar */}
    <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
      {draggedAppt ? (() => {
        const col = COLUMNS.find(c => c.key === draggedAppt.status) ?? COLUMNS[0]
        return (
          <KanbanCard
            appt={draggedAppt}
            col={col}
            others={[]}
            moving={null}
            onEdit={() => {}}
            onMove={() => {}}
            onDelete={() => {}}
            onReinvite={() => {}}
            overlay
          />
        )
      })() : null}
    </DragOverlay>
    </DndContext>

    {/* Modal: arquivar encontro */}
    {archiveModal && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:border dark:border-slate-800">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-gray-500 dark:text-slate-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Arquivar encontro</h2>
            </div>
            <button onClick={() => setArchiveModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-3">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Selecione o encontro para arquivar. Os leads sumirão desta tela e ficam salvos no histórico.
            </p>
            {meetingDates.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">Nenhum encontro ativo</p>
            ) : (
              <div className="space-y-2">
                {meetingDates.map((date) => {
                  const count = appointments.filter(a =>
                    new Date(a.scheduledAt).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }) === date
                  ).length
                  const label = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                    timeZone: 'America/Sao_Paulo',
                  })
                  return (
                    <button
                      key={date}
                      disabled={archivingDate === date}
                      onClick={() => archiveMeeting(date)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                    >
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{label}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{count} lead{count !== 1 ? 's' : ''}</p>
                      </div>
                      {archivingDate === date
                        ? <span className="text-xs text-gray-400">Arquivando...</span>
                        : <ChevronRight className="h-4 w-4 text-gray-400" />
                      }
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Modal: editar agendamento */}
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
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Título *</label>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
                className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Nome *</label>
                <input
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  required
                  className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">WhatsApp *</label>
                <input
                  value={editForm.customerPhone}
                  onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                  required
                  className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Data e horário *</label>
              <input
                type="datetime-local"
                value={editForm.scheduledAt}
                onChange={(e) => setEditForm({ ...editForm, scheduledAt: e.target.value })}
                required
                className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Observações</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEditingAppt(null)}
                className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
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
