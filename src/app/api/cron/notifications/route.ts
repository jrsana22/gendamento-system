import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWhatsAppMessage, buildMessage } from '@/lib/evolution'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/notifications
 *
 * Envia exatamente 1 lembrete pendente por chamada.
 * O delay entre mensagens é controlado pelo GitHub Actions (sleep 30).
 * Isso mantém a execução sempre abaixo do timeout do Vercel Hobby (10s).
 *
 * Retorna:
 *   { ok: true, sent: 0|1, remaining: N }
 */
export async function GET() {
  const now = new Date()

  // Pega a próxima notificação pendente (a mais urgente primeiro)
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

  // Conta quantas ainda estão pendentes (para o loop do Actions saber quando parar)
  const remaining = await prisma.notification.count({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
  })

  if (!notif) {
    return NextResponse.json({ ok: true, sent: 0, remaining: 0 })
  }

  const { appointment } = notif
  const { client } = appointment

  // Agendamento cancelado: marca como falha e retorna
  if (appointment.status === 'CANCELLED') {
    await prisma.notification.update({
      where: { id: notif.id },
      data: { status: 'FAILED', error: 'Agendamento cancelado' },
    })
    return NextResponse.json({ ok: true, sent: 0, remaining: remaining - 1, skipped: true })
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
    console.log(`[notif] ✅ ${client.instanceName} → ${appointment.customerName} (${notif.type})`)
  } else {
    console.error(`[notif] ❌ ${client.instanceName} → ${appointment.customerName}: ${result.error}`)
  }

  return NextResponse.json({
    ok: true,
    sent: result.success ? 1 : 0,
    failed: result.success ? 0 : 1,
    remaining: remaining - 1,
    customer: appointment.customerName,
    type: notif.type,
  })
}
