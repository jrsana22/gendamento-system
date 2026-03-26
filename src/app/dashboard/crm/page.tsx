'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Phone, User, Search, ChevronDown, ChevronUp, Pencil, X, GripVertical, Archive, ChevronRight } from 'lucide-react'
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

const colStyleOver: Record<string, string> = {
  blue:   'bg-blue-100 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600',
  green:  'bg-green-100 dark:bg-green-950/40 border-green-400 dark:border-green-600',
  red:    'bg-red-100 dark:bg-red-950/40 border-red-400 dark:border-red-600',
  purple: 'bg-purple-100 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600',
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

// ── Draggable Card ──────────────────────────────────────────────
function DraggableCard({
  appt, col, others, moving, onEdit, onMove, overlay = false,
}: {
  appt: Appointment
  col: typeof COLUMNS[0]
  others: typeof COLUMNS
  moving: string | null
  onEdit: (a: Appointment) => void
  onMove: (id: string, status: string) => void
  overlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: appt.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging && !overlay ? 0.35 : 1,
    touchAction: 'none' as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-3 space-y-2 transition-shadow ${
        overlay ? 'shadow-2xl rotate-1 scale-105' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className="mt-0.5 flex-shrink-0 text-gray-300 dark:text-slate-600 hover:text-gray-400 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight block truncate">
            {appt.customerName}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            <Phone className="h-3 w-3 flex-shrink-0" />
            {appt.customerPhone}
          </div>
        </div>
      </div>

      {appt.notes && (
        <p className="text-xs text-gray-400 dark:text-slate-500 italic truncate">{appt.notes}</p>
      )}

      {!overlay && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={() => onEdit(appt)}
            className="text-xs px-2 py-1 rounded-md font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center gap-1"
          >
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
                onClick={() => onMove(appt.id, o.key)}
                className={`text-xs px-2 py-1 rounded-md font-medium transition-opacity ${badgeStyle[o.key]} hover:opacity-80 disabled:opacity-40`}
              >
                {arrow} {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Droppable Column ────────────────────────────────────────────
function DroppableColumn({
  col, cards, moving, expanded, onToggleExpand, onEdit, onMove,
}: {
  col: typeof COLUMNS[0]
  cards: Appointment[]
  moving: string | null
  expanded: boolean
  onToggleExpand: () => void
  onEdit: (a: Appointment) => void
  onMove: (id: string, status: string) => void
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
      className={`rounded-xl border-2 flex flex-col transition-all duration-150 ${
        isOver ? colStyleOver[col.color] : colStyle[col.color]
      }`}
    >
      <div className={`rounded-t-xl px-4 py-3 flex items-center justify-between ${headerStyle[col.color]}`}>
        <span className="font-semibold text-sm">{col.label}</span>
        <span className="text-xs font-bold bg-white dark:bg-slate-900 bg-opacity-60 rounded-full px-2 py-0.5">
          {cards.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3 flex-1">
        {cards.length === 0 && (
          <div className={`flex items-center justify-center py-8 rounded-xl border-2 border-dashed transition-colors ${
            isOver
              ? 'border-current opacity-60 bg-white/20 dark:bg-white/5'
              : 'border-gray-200 dark:border-slate-700'
          }`}>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              {isOver ? 'Solte aqui' : 'Nenhum contato'}
            </p>
          </div>
        )}

        {visibleGroups.map(([dateKey, items]) => (
          <div key={dateKey}>
            <div className={`text-xs font-semibold px-2 py-1 rounded-md mb-1 ${dateGroupStyle[col.color]}`}>
              {formatDateGroup(dateKey + 'T12:00:00')}
            </div>
            <div className="flex flex-col gap-2">
              {items.map((appt) => (
                <DraggableCard
                  key={appt.id}
                  appt={appt}
                  col={col}
                  others={others}
                  moving={moving}
                  onEdit={onEdit}
                  onMove={onMove}
                />
              ))}
            </div>
          </div>
        ))}

        {cards.length > INITIAL_SHOW && (
          <button
            onClick={onToggleExpand}
            className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300 py-1 font-medium"
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

// ── Mobile Kanban — tab única com auto-switch ─────────────────────
const COL_ABBREV: Record<string, string> = {
  SCHEDULED: 'Agendado',
  DONE: 'Compareceu',
  CANCELLED: 'N. Comp.',
  CONSULTANT: 'Consultor',
}
const COL_MOVE_LABEL: Record<string, string> = {
  SCHEDULED: 'Agend.',
  DONE: 'Comp.',
  CANCELLED: 'N.Comp',
  CONSULTANT: 'Consul.',
}

function MobileKanban({
  filtered, moving, onEdit, onMove,
}: {
  filtered: Appointment[]
  moving: string | null
  onEdit: (a: Appointment) => void
  onMove: (id: string, status: string) => void
}) {
  const [activeIdx, setActiveIdx] = useState(0)

  function moveAndSwitch(id: string, targetKey: string) {
    onMove(id, targetKey)
    const idx = COLUMNS.findIndex(c => c.key === targetKey)
    if (idx !== -1) setTimeout(() => setActiveIdx(idx), 120)
  }

  const col = COLUMNS[activeIdx]
  const cards = filtered.filter(a => a.status === col.key)
  const others = COLUMNS.filter(c => c.key !== col.key)
  const groups = groupByDate(cards)

  return (
    <div className="md:hidden w-full space-y-3">
      {/* Tab bar */}
      <div className={`flex rounded-xl border-2 overflow-hidden ${colStyle[col.color]}`}>
        {COLUMNS.map((c, i) => {
          const count = filtered.filter(a => a.status === c.key).length
          const isActive = i === activeIdx
          return (
            <button
              key={c.key}
              onClick={() => setActiveIdx(i)}
              className={`flex-1 py-2.5 text-center transition-all ${
                isActive
                  ? headerStyle[c.color] + ' font-bold'
                  : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
            >
              <span className="text-xs leading-none block">{COL_ABBREV[c.key]}</span>
              <span className={`text-sm font-bold mt-0.5 block ${isActive ? '' : 'text-gray-500 dark:text-slate-400'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Cards da coluna ativa */}
      <div className="space-y-3 w-full">
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-400 dark:text-slate-500">Nenhum contato nesta coluna</p>
          </div>
        )}

        {groups.map(([dateKey, items]) => (
          <div key={dateKey} className="space-y-2">
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${dateGroupStyle[col.color]}`}>
              {formatDateGroup(dateKey + 'T12:00:00')}
            </div>

            {items.map((appt) => (
              <div key={appt.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm w-full overflow-hidden">
                {/* Info */}
                <div className="px-4 py-3 space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{appt.customerName}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{appt.customerPhone}</p>
                  {appt.notes && <p className="text-xs text-gray-400 dark:text-slate-500 italic truncate">{appt.notes}</p>}
                </div>

                {/* Ações */}
                <div className="flex border-t border-gray-100 dark:border-slate-800">
                  <button
                    onClick={() => onEdit(appt)}
                    className="flex-1 py-2.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  {others.map((o, oi) => (
                    <button
                      key={o.key}
                      disabled={moving === appt.id}
                      onClick={() => moveAndSwitch(appt.id, o.key)}
                      className={`flex-1 py-2.5 text-xs font-bold transition-colors disabled:opacity-40 border-l border-gray-100 dark:border-slate-800 flex items-center justify-center ${badgeStyle[o.key]} hover:opacity-80`}
                    >
                      {COL_MOVE_LABEL[o.key]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
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

  // Touch sensor: delay + tolerance so tapping buttons still works
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  const fetchAppointments = useCallback(async () => {
    const res = await fetch('/api/appointments')
    const data = await res.json()
    setAppointments(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  function openEdit(appt: Appointment) {
    const localDT = new Date(appt.scheduledAt)
      .toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' })
      .replace(' ', 'T')
      .slice(0, 16)
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
    // Optimistic update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    setMoving(id)
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      // Revert on error
      await fetchAppointments()
      toast.error('Erro ao mover card')
    }
    setMoving(null)
  }

  // Unique meeting dates from loaded appointments
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

  const filtered = appointments.filter((a) =>
    a.customerName.toLowerCase().includes(search.toLowerCase()) ||
    a.customerPhone.includes(search)
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 dark:text-slate-500">Carregando...</div>
  }

  return (
    <>
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="space-y-4">
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

      {/* Desktop: 4 columns with drag-and-drop */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.key}
            col={col}
            cards={filtered.filter(a => a.status === col.key)}
            moving={moving}
            expanded={!!expanded[col.key]}
            onToggleExpand={() => setExpanded(e => ({ ...e, [col.key]: !e[col.key] }))}
            onEdit={openEdit}
            onMove={moveCard}
          />
        ))}
      </div>

      {/* Mobile: horizontal scroll kanban */}
      <MobileKanban
        filtered={filtered}
        moving={moving}
        onEdit={openEdit}
        onMove={moveCard}
      />
    </div>

    {/* Drag overlay — the floating card while dragging */}
    <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
      {draggedAppt ? (() => {
        const col = COLUMNS.find(c => c.key === draggedAppt.status) ?? COLUMNS[0]
        return (
          <DraggableCard
            appt={draggedAppt}
            col={col}
            others={[]}
            moving={null}
            onEdit={() => {}}
            onMove={() => {}}
            overlay
          />
        )
      })() : null}
    </DragOverlay>
    </DndContext>

    {/* Modal de arquivar encontro */}
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
