import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWhatsAppMessage, buildMessage } from '@/lib/evolution'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/notifications
 *
 * Processa TODOS os lembretes pendentes cujo horário chegou em paralelo.
 *
 * Por que paralelo sem delay?
 * - Cada mensagem vai para um número/destinatário diferente (não é spam)
 * - Evolution API suporta chamadas simultâneas
 * - Vercel Hobby tem timeout de 10s — delay sequencial travaria com muitas pessoas
 * - Com paralelo: 50 pessoas → ~2-3s de execução
 *
 * Risco de ban é para envio em massa de mensagens idênticas a desconhecidos.
 * Lembretes personalizados a contatos agendados não se enquadram nisso.
 */
export async function GET() {
  const now = new Date()

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
      { appointment: { scheduledAt: 'asc' } },
      { createdAt: 'asc' },
    ],
    take: 500,
  })

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const results = await Promise.allSettled(
    pending.map(async (notif) => {
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
        console.log(`[notif] ✅ ${client.instanceName} → ${appointment.customerName} (${notif.type})`)
      } else {
        console.error(`[notif] ❌ ${client.instanceName} → ${appointment.customerName}: ${result.error}`)
      }

      return { success: result.success }
    })
  )

  const sent = results.filter(
    (r) => r.status === 'fulfilled' && (r.value as { success?: boolean }).success
  ).length
  const failed = results.filter(
    (r) => r.status === 'rejected' ||
      (r.status === 'fulfilled' && !(r.value as { success?: boolean }).success && !(r.value as { skipped?: boolean }).skipped)
  ).length

  return NextResponse.json({ ok: true, processed: pending.length, sent, failed })
}
