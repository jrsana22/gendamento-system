import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWhatsAppMessage, buildMessage } from '@/lib/evolution'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/notifications
 *
 * Processa lembretes pendentes com rate limit por instância Evolution:
 * → Máximo de 1 mensagem por minuto por instanceName (evita banimento)
 *
 * Se 25 pessoas têm reunião no mesmo horário e o lembrete dispara junto,
 * o sistema envia 1 por minuto, na ordem de criação do agendamento.
 */
export async function GET() {
  const now = new Date()

  // Busca notificações pendentes cujo horário já chegou
  const pending = await prisma.notification.findMany({
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
      // Prioriza por horário do agendamento (mais próximo primeiro)
      { appointment: { scheduledAt: 'asc' } },
      // Depois por ordem de criação (quem agendou primeiro)
      { createdAt: 'asc' },
    ],
    take: 200,
  })

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  // Rate limit: 1 por instanceName por execução do cron
  const sentInstances = new Set<string>()
  const toProcess = pending.filter((n) => {
    const key = n.appointment.client.instanceName
    if (sentInstances.has(key)) return false
    sentInstances.add(key)
    return true
  })

  const results = await Promise.allSettled(
    toProcess.map(async (notif) => {
      const { appointment } = notif
      const { client } = appointment

      if (appointment.status === 'CANCELLED') {
        await prisma.notification.update({
          where: { id: notif.id },
          data: { status: 'FAILED', error: 'Agendamento cancelado' },
        })
        return { skipped: true }
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
        console.log(
          `[notif] ✅ ${client.instanceName} → ${appointment.customerName} (${notif.type})`
        )
      } else {
        console.error(
          `[notif] ❌ ${client.instanceName} → ${appointment.customerName}: ${result.error}`
        )
      }

      return { success: result.success }
    })
  )

  const sent = results.filter(
    (r) => r.status === 'fulfilled' && (r.value as { success?: boolean }).success
  ).length
  const failed = results.filter(
    (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !(r.value as { success?: boolean }).success && !(r.value as { skipped?: boolean }).skipped)
  ).length
  const skipped = pending.length - toProcess.length // aguardam próxima rodada (rate limit)

  return NextResponse.json({
    ok: true,
    processed: toProcess.length,
    sent,
    failed,
    queued: skipped, // serão enviados no próximo minuto
  })
}
