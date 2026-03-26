import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { scheduleNotifications } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// POST /api/appointments/fix-notifications
// Cria lembretes para agendamentos futuros que não têm nenhum
export async function POST() {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const now = new Date()

  // Busca agendamentos futuros sem nenhuma notificação
  const appointments = await prisma.appointment.findMany({
    where: {
      clientId: session.clientId,
      scheduledAt: { gt: now },
      notifications: { none: {} },
    },
  })

  let created = 0
  for (const appt of appointments) {
    await scheduleNotifications(appt.id, appt.scheduledAt)
    created++
  }

  return NextResponse.json({ ok: true, fixed: created })
}
