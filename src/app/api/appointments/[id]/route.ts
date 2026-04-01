import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cancelPendingNotifications, scheduleNotifications } from '@/lib/notifications'

async function findAppointment(id: string, clientId: string) {
  return prisma.appointment.findFirst({ where: { id, clientId } })
}

// GET /api/appointments/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const appt = await prisma.appointment.findFirst({
    where: { id: params.id, clientId: session.clientId },
    include: { notifications: { orderBy: { scheduledAt: 'asc' } } },
  })
  if (!appt) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(appt)
}

// PUT /api/appointments/:id - atualiza
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const appt = await findAppointment(params.id, session.clientId)
  if (!appt) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const { title, customerName, customerPhone, scheduledAt, notes, status } = await req.json()

  const newDate = scheduledAt ? new Date(scheduledAt) : appt.scheduledAt
  const dateChanged = newDate.getTime() !== appt.scheduledAt.getTime()
  const statusChanged = status && status !== appt.status

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: { title, customerName, customerPhone, scheduledAt: newDate, notes, status },
  })

  // Se a data mudou ou foi cancelado, reagenda/remove notificações
  if (dateChanged || status === 'CANCELLED') {
    await cancelPendingNotifications(params.id)
    if (status !== 'CANCELLED' && newDate > new Date()) {
      await scheduleNotifications(params.id, newDate)
    }
  }

  // Se status mudou para SCHEDULED (de DONE ou CANCELLED), regenera lembretes
  if (statusChanged && status === 'SCHEDULED' && newDate > new Date()) {
    await scheduleNotifications(params.id, newDate)
  }

  return NextResponse.json(updated)
}

// DELETE /api/appointments/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const appt = await findAppointment(params.id, session.clientId)
  if (!appt) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.appointment.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
