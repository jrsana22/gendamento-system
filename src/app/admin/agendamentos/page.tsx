import { prisma } from '@/lib/db'
import { formatDateTime, STATUS_LABELS, NOTIF_LABELS, NOTIF_STATUS_LABELS } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

const statusVariant: Record<string, 'blue' | 'green' | 'red'> = {
  SCHEDULED: 'blue',
  DONE: 'green',
  CANCELLED: 'red',
}

const notifStatusVariant: Record<string, 'yellow' | 'green' | 'red'> = {
  PENDING: 'yellow',
  SENT: 'green',
  FAILED: 'red',
}

export default async function AdminAgendamentosPage() {
  const appointments = await prisma.appointment.findMany({
    include: {
      client: { select: { name: true } },
      notifications: { orderBy: { scheduledAt: 'asc' } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Todos os Agendamentos</h1>
        <p className="text-gray-500 mt-1">Visualize agendamentos e status de notificações de todos os clientes</p>
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Calendar className="h-12 w-12 mb-3" />
          <p>Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
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
                  <p className="text-xs text-gray-400 mt-1">
                    Cliente: <span className="font-medium">{appt.client.name}</span> · Tel: {appt.customerPhone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatDateTime(appt.scheduledAt)}</p>
                </div>
              </div>

              {appt.notifications.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
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
