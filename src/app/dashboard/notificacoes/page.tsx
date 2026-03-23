import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDateTime, NOTIF_LABELS, NOTIF_STATUS_LABELS } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Bell } from 'lucide-react'

export const dynamic = 'force-dynamic'

const notifVariant: Record<string, 'yellow' | 'green' | 'red'> = {
  PENDING: 'yellow', SENT: 'green', FAILED: 'red',
}

export default async function NotificacoesPage() {
  const session = await getSession()
  if (!session?.clientId) return null

  const notifications = await prisma.notification.findMany({
    where: { appointment: { clientId: session.clientId } },
    include: {
      appointment: {
        select: { customerName: true, title: true, scheduledAt: true },
      },
    },
    orderBy: { scheduledAt: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        <p className="text-gray-500 mt-1">Histórico de todos os lembretes enviados via WhatsApp</p>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Bell className="h-12 w-12 mb-3" />
          <p>Nenhuma notificação ainda</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Cliente', 'Agendamento', 'Lembrete', 'Previsto para', 'Enviado em', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{n.appointment.customerName}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {n.appointment.title}
                    <span className="text-gray-400 ml-1">· {formatDateTime(n.appointment.scheduledAt)}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">{NOTIF_LABELS[n.type]}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{formatDateTime(n.scheduledAt)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {n.sentAt ? formatDateTime(n.sentAt) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={notifVariant[n.status] ?? 'gray'}>
                      {NOTIF_STATUS_LABELS[n.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
