import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWhatsAppMessage, buildMessage } from '@/lib/evolution'

export const dynamic = 'force-dynamic'

/**
 * POST /api/test-notify
 * Envia uma mensagem de teste de lembrete para o número do agendamento mais recente.
 * Protegido pelo mesmo CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { appointmentId, type = '24H' } = await req.json()

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true },
  })

  if (!appointment) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
  }

  const text = buildMessage(
    type as '24H' | '3H' | '1H' | '15MIN',
    appointment.customerName,
    appointment.scheduledAt,
    appointment.title
  )

  const result = await sendWhatsAppMessage({
    evoUrl: appointment.client.evoUrl,
    apiKey: appointment.client.apiKey,
    instanceName: appointment.client.instanceName,
    to: appointment.customerPhone,
    text,
  })

  return NextResponse.json({ ok: result.success, result })
}
