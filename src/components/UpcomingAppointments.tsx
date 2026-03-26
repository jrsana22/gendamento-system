'use client'

import { useState } from 'react'
import { formatDateTime, STATUS_LABELS } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CheckCircle, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  status: string
}

interface Appointment {
  id: string
  customerName: string
  title: string
  customerPhone: string
  scheduledAt: string | Date
  status: string
  notifications: Notification[]
}

export function UpcomingAppointments({ appointments }: { appointments: Appointment[] }) {
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? appointments : appointments.slice(0, 5)
  const hasMore = appointments.length > 5

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-slate-500">
        <CheckCircle className="h-10 w-10 mb-3" />
        <p className="text-sm">Nenhum agendamento futuro</p>
        <Link href="/dashboard/agendamentos/novo">
          <Button className="mt-4" size="sm">
            <Plus className="h-4 w-4" /> Criar agendamento
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {visible.map((appt) => {
          const notifsSent = appt.notifications.filter((n) => n.status === 'SENT').length
          const notifsTotal = appt.notifications.length
          return (
            <div key={appt.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{appt.customerName}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{appt.title}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {appt.customerPhone} · {notifsTotal > 0 ? `${notifsSent}/${notifsTotal} lembretes enviados` : 'Sem lembretes'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(appt.scheduledAt)}</p>
                <Badge variant="blue">{STATUS_LABELS[appt.status]}</Badge>
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {showAll ? (
              <><ChevronUp className="h-4 w-4" /> Ocultar</>
            ) : (
              <><ChevronDown className="h-4 w-4" /> Ver todos ({appointments.length})</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
