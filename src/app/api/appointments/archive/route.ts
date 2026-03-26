import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/appointments/archive
// Body: { date: "2026-03-27" } — arquiva todos os agendamentos daquele dia
// Body: { ids: ["id1","id2"] } — arquiva IDs específicos
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { date, ids } = await req.json()

  let where: Record<string, unknown> = { clientId: session.clientId, archived: false }

  if (ids && Array.isArray(ids)) {
    where = { ...where, id: { in: ids } }
  } else if (date) {
    // Archive all appointments on that date (São Paulo timezone)
    const start = new Date(date + 'T00:00:00-03:00')
    const end = new Date(date + 'T23:59:59-03:00')
    where = { ...where, scheduledAt: { gte: start, lte: end } }
  } else {
    return NextResponse.json({ error: 'Informe date ou ids' }, { status: 400 })
  }

  const result = await prisma.appointment.updateMany({
    where,
    data: { archived: true, archivedAt: new Date() },
  })

  return NextResponse.json({ archived: result.count })
}
