import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ALL_TYPES = ['24H', '3H', '1H', '15MIN']
const OFFSETS: Record<string, number> = { '24H': 24 * 60, '3H': 3 * 60, '1H': 60, '15MIN': 15 }

// POST /api/appointments/fix-notifications
// Cria os tipos de lembrete faltantes para agendamentos futuros
export async function POST() {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const now = new Date()

  const appointments = await prisma.appointment.findMany({
    where: {
      clientId: session.clientId,
      scheduledAt: { gt: now },
    },
    include: {
      notifications: { select: { type: true } },
    },
  })

  let fixed = 0
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
    fixed++
  }

  return NextResponse.json({ ok: true, fixed })
}
