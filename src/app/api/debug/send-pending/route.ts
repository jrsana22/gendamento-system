import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWhatsAppMessage, buildMessage } from '@/lib/evolution'

export const dynamic = 'force-dynamic'

/**
 * GET /api/debug/send-pending?password=XXX
 *
 * Endpoint de DEBUG para disparar notificações pendentes manualmente.
 * REMOVER EM PRODUÇÃO!
 *
 * Uso:
 * curl "https://agendamento.solucoesdeia.com/api/debug/send-pending?password=debug123"
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const password = searchParams.get('password')

  // Senha simples para teste - trocar depois
  if (password !== 'debug123') {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const now = new Date()

  // Pega a próxima notificação pendente
  const notif = await prisma.notification.findFirst({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    include: {
      appointment: {
        include: { client: true },
      },
    },
    orderBy: [
      { appointment: { scheduledAt: 'asc' } },
      { createdAt: 'asc' },
    ],
  })

  if (!notif) {
    return NextResponse.json({
      message: 'Nenhuma notificação pendente encontrada',
      now: now.toISOString()
    })
  }

  const { appointment } = notif
  const { client } = appointment

  if (appointment.status === 'CANCELLED') {
    await prisma.notification.update({
      where: { id: notif.id },
      data: { status: 'FAILED', error: 'Agendamento cancelado' },
    })
    return NextResponse.json({
      message: 'Agendamento cancelado - notificação marcada como falha',
      appointment: appointment.customerName
    })
  }

  const text = buildMessage(
    notif.type as '24H' | '3H' | '1H' | '15MIN',
    appointment.customerName,
    appointment.scheduledAt,
    appointment.title
  )

  const result = await sendWhatsAppMessage({
    evoUrl: client.evoUrl,
    apiKey: client.apiKey,
    instanceName: client.instanceName,
    to: appointment.customerPhone,
    text,
  })

  await prisma.notification.update({
    where: { id: notif.id },
    data: {
      status: result.success ? 'SENT' : 'FAILED',
      sentAt: result.success ? new Date() : null,
      error: result.error ?? null,
    },
  })

  if (result.success) {
    console.log(`[debug] ✅ ${client.instanceName} → ${appointment.customerName} (${notif.type})`)
  } else {
    console.error(`[debug] ❌ ${client.instanceName} → ${appointment.customerName}: ${result.error}`)
  }

  return NextResponse.json({
    success: result.success,
    customer: appointment.customerName,
    type: notif.type,
    phone: appointment.customerPhone,
    message: text,
    error: result.error ?? null,
  })
}
