import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NOTIF_LABELS, NOTIF_STATUS_LABELS } from '@/lib/utils'
import { Bell, Clock, CheckCircle, XCircle } from 'lucide-react'
import { LeadActions } from './LeadActions'

export const dynamic = 'force-dynamic'

const typeOrder: Record<string, number> = { '24H': 1, '3H': 2, '1H': 3, '15MIN': 4 }

function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function fmtDateLabel(dateKey: string) {
  return new Date(dateKey + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

const statusPill: Record<string, string> = {
  PENDING: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
  SENT: 'bg-green-50 border border-green-200 text-green-700',
  FAILED: 'bg-red-50 border border-red-200 text-red-700',
}

const statusDot: Record<string, string> = {
  PENDING: 'bg-yellow-400',
  SENT: 'bg-green-500',
  FAILED: 'bg-red-500',
}

async function ensureNotifications(clientId: string) {
  const now = new Date()
  const ALL_TYPES = ['24H', '3H', '1H', '15MIN']
  const OFFSETS: Record<string, number> = { '24H': 24 * 60, '3H': 3 * 60, '1H': 60, '15MIN': 15 }

  const appointments = await prisma.appointment.findMany({
    where: { clientId, scheduledAt: { gt: now } },
    include: { notifications: { select: { type: true } } },
  })

  for (const appt of appointments) {
    const existingTypes = new Set(appt.notifications.map((n) => n.type))
    const missingTypes = ALL_TYPES.filter((t) => !existingTypes.has(t))
    if (missingTypes.length === 0) continue

    await prisma.notification.createMany({
      data: missingTypes.map((type) => {
        const notifAt = new Date(appt.scheduledAt.getTime() - OFFSETS[type] * 60 * 1000)
        return {
          appointmentId: appt.id,
          type,
          scheduledAt: notifAt,
          status: notifAt > now ? 'PENDING' : 'FAILED',
        }
      }),
    })
  }
}

export default async function NotificacoesPage() {
  const session = await getSession()
  if (!session?.clientId) return null

  await ensureNotifications(session.clientId)

  const notifications = await prisma.notification.findMany({
    where: { appointment: { clientId: session.clientId } },
    include: {
      appointment: {
        select: { id: true, customerName: true, title: true, scheduledAt: true },
      },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  const pending = notifications.filter((n) => n.status === 'PENDING').length
  const sent = notifications.filter((n) => n.status === 'SENT').length
  const failed = notifications.filter((n) => n.status === 'FAILED').length

  // Group by appointment
  const byAppt: Record<string, typeof notifications> = {}
  for (const n of notifications) {
    const key = n.appointment.id
    if (!byAppt[key]) byAppt[key] = []
    byAppt[key].push(n)
  }
  for (const key of Object.keys(byAppt)) {
    byAppt[key].sort((a, b) => (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9))
  }

  // Group appointment groups by date
  const byDate: Record<string, (typeof notifications)[]> = {}
  for (const notifs of Object.values(byAppt)) {
    const dateKey = new Date(notifs[0].appointment.scheduledAt)
      .toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    if (!byDate[dateKey]) byDate[dateKey] = []
    byDate[dateKey].push(notifs)
  }
  const sortedDates = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificações</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Lembretes via WhatsApp por lead e agendamento</p>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-yellow-200 dark:border-yellow-900/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 flex items-center justify-center">
            <Clock className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{pending}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Pendentes</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-green-200 dark:border-green-900/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{sent}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Enviadas</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{failed}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Falhas</p>
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-500">
          <Bell className="h-12 w-12 mb-3" />
          <p className="font-medium text-gray-500 dark:text-slate-400">Nenhuma notificação ainda</p>
          <p className="text-sm mt-1">Crie agendamentos para gerar lembretes automáticos</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedDates.map(([dateKey, apptGroups]) => (
            <div key={dateKey}>
              {/* Date divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gray-200 dark:bg-slate-800" />
                <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest capitalize px-1">
                  {fmtDateLabel(dateKey)}
                </span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-slate-800" />
              </div>

              <div className="space-y-3">
                {apptGroups.map((notifs) => {
                  const appt = notifs[0].appointment
                  const sentCount = notifs.filter((n) => n.status === 'SENT').length
                  const total = notifs.length
                  const allSent = sentCount === total
                  const hasFailed = notifs.some((n) => n.status === 'FAILED')
                  const initial = appt.customerName[0]?.toUpperCase() ?? '?'

                  return (
                    <div key={appt.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      {/* Lead row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm flex-shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{appt.customerName}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">
                              {appt.title} · {fmtTime(appt.scheduledAt)}h
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                            allSent
                              ? 'bg-green-50 text-green-700'
                              : hasFailed
                              ? 'bg-red-50 text-red-700'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {allSent
                              ? <CheckCircle className="h-3.5 w-3.5" />
                              : hasFailed
                              ? <XCircle className="h-3.5 w-3.5" />
                              : <Clock className="h-3.5 w-3.5" />}
                            {sentCount}/{total} enviados
                          </span>
                          <LeadActions appointmentId={appt.id} />
                        </div>
                      </div>

                      {/* Notification columns */}
                      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-slate-800 bg-gray-50 dark:bg-slate-800/30">
                        {notifs.map((n) => (
                          <div key={n.id} className="px-4 py-3 space-y-2">
                            {/* Type + dot */}
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${statusDot[n.status] ?? 'bg-gray-300'}`} />
                              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 tracking-wide">
                                {NOTIF_LABELS[n.type]}
                              </span>
                            </div>
                            {/* Status pill */}
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusPill[n.status] ?? ''}`}>
                              {NOTIF_STATUS_LABELS[n.status]}
                            </span>
                            {/* Times */}
                            <div className="space-y-0.5">
                              <p className="text-xs text-gray-400 dark:text-slate-500">
                                <span className="font-medium">Prev:</span> {fmtDateTime(n.scheduledAt)}
                              </p>
                              {n.sentAt && (
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  <span>Env:</span> {fmtDateTime(n.sentAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {Array.from({ length: 4 - notifs.length }).map((_, i) => (
                          <div key={i} className="px-4 py-3" />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
