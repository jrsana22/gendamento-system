import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDateTime, STATUS_LABELS } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Calendar, Bell, CheckCircle, Clock, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.clientId) return null

  const [totalAppointments, pendingNotifs, upcomingAppointments] = await Promise.all([
    prisma.appointment.count({ where: { clientId: session.clientId } }),
    prisma.notification.count({
      where: {
        status: 'PENDING',
        appointment: { clientId: session.clientId },
      },
    }),
    prisma.appointment.findMany({
      where: {
        clientId: session.clientId,
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      include: { notifications: true },
    }),
  ])

  const stats = [
    { label: 'Total de agendamentos', value: totalAppointments, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Lembretes pendentes', value: pendingNotifs, icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Próximos', value: upcomingAppointments.length, icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Seus agendamentos e lembretes automáticos</p>
        </div>
        <Link href="/dashboard/agendamentos/novo">
          <Button>
            <Plus className="h-4 w-4" /> Novo agendamento
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Próximos agendamentos</h2>
          <Link href="/dashboard/agendamentos" className="text-sm text-blue-600 hover:underline">Ver todos</Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CheckCircle className="h-10 w-10 mb-3" />
            <p className="text-sm">Nenhum agendamento futuro</p>
            <Link href="/dashboard/agendamentos/novo">
              <Button className="mt-4" size="sm">
                <Plus className="h-4 w-4" /> Criar agendamento
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingAppointments.map((appt) => {
              const notifsSent = appt.notifications.filter((n) => n.status === 'SENT').length
              const notifsTotal = appt.notifications.length
              return (
                <div key={appt.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{appt.customerName}</p>
                    <p className="text-sm text-gray-500">{appt.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {appt.customerPhone} · {notifsTotal > 0 ? `${notifsSent}/${notifsTotal} lembretes enviados` : 'Sem lembretes'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatDateTime(appt.scheduledAt)}</p>
                    <Badge variant="blue">{STATUS_LABELS[appt.status]}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
