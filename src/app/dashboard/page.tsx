import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDateTime, STATUS_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Calendar, Bell, Clock, Plus } from 'lucide-react'
import Link from 'next/link'
import { UpcomingAppointments } from '@/components/UpcomingAppointments'
import { FailedNotifAlert } from '@/components/FailedNotifAlert'

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
      include: { notifications: true },
    }),
  ])

  const stats = [
    { label: 'Total de agendamentos', value: totalAppointments, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Lembretes pendentes', value: pendingNotifs, icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/40' },
    { label: 'Próximos', value: upcomingAppointments.length, icon: Clock, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/40' },
  ]

  return (
    <div className="space-y-8">
      <FailedNotifAlert />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Seus agendamentos e lembretes automáticos</p>
        </div>
        <Link href="/dashboard/agendamentos/novo">
          <Button>
            <Plus className="h-4 w-4" /> Novo agendamento
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Próximos agendamentos</h2>
          <Link href="/dashboard/agendamentos" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Ver todos</Link>
        </div>

        <UpcomingAppointments appointments={upcomingAppointments} />
      </div>
    </div>
  )
}
