import { prisma } from '@/lib/db'
import { formatDateTime, STATUS_LABELS } from '@/lib/utils'
import { Users, Calendar, Bell, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [totalClients, totalAppointments, pendingNotifs, upcomingAppointments] = await Promise.all([
    prisma.client.count(),
    prisma.appointment.count(),
    prisma.notification.count({ where: { status: 'PENDING' } }),
    prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
      include: { client: { select: { name: true } } },
    }),
  ])

  const stats = [
    { label: 'Clientes', value: totalClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Agendamentos', value: totalAppointments, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Lembretes pendentes', value: pendingNotifs, icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>
        <p className="text-gray-500 mt-1">Visão geral de todos os clientes e agendamentos</p>
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
          <Link href="/admin/agendamentos" className="text-sm text-blue-600 hover:underline">Ver todos</Link>
        </div>
        {upcomingAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CheckCircle className="h-10 w-10 mb-3" />
            <p className="text-sm">Nenhum agendamento futuro</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingAppointments.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900">{appt.customerName}</p>
                  <p className="text-sm text-gray-500">{appt.title} · {appt.client.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatDateTime(appt.scheduledAt)}</p>
                  <Badge variant="blue">Agendado</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
