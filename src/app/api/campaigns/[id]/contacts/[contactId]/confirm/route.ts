import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { scheduleNotifications } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/campaigns/:id/contacts/:contactId/confirm
 *
 * Confirma a presença de um contato:
 * 1. Cria um Appointment para ele
 * 2. Agenda os 4 lembretes automáticos
 * 3. Marca o contato como CONFIRMED
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const contact = await prisma.campaignContact.findFirst({
    where: { id: params.contactId, campaignId: params.id },
    include: { campaign: true },
  })

  if (!contact) return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
  if (contact.status === 'CONFIRMED') {
    return NextResponse.json({ error: 'Contato já confirmado' }, { status: 400 })
  }

  const appointment = await prisma.appointment.create({
    data: {
      title: contact.campaign.title,
      customerName: contact.name,
      customerPhone: contact.phone,
      scheduledAt: contact.campaign.scheduledAt,
      notes: `Confirmado via campanha "${contact.campaign.title}"`,
      clientId: session.clientId,
    },
  })

  await scheduleNotifications(appointment.id, contact.campaign.scheduledAt)

  await prisma.campaignContact.update({
    where: { id: params.contactId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      appointmentId: appointment.id,
    },
  })

  return NextResponse.json({ ok: true, appointmentId: appointment.id })
}

/**
 * DELETE /api/campaigns/:id/contacts/:contactId/confirm
 * Marca como DECLINED (não vai comparecer)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  await prisma.campaignContact.update({
    where: { id: params.contactId },
    data: { status: 'DECLINED' },
  })

  return NextResponse.json({ ok: true })
}
