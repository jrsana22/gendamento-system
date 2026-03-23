import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/admin/appointments - todos os agendamentos de todos os clientes
export async function GET() {
  const appointments = await prisma.appointment.findMany({
    include: {
      client: { select: { name: true } },
      notifications: true,
    },
    orderBy: { scheduledAt: 'asc' },
  })
  return NextResponse.json(appointments)
}
