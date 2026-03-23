import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scheduleNotifications } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/webhook/:token
 *
 * Endpoint público chamado pelo agente n8n quando alguém confirma presença no WhatsApp.
 * O token identifica o cliente — cada cliente tem o seu próprio.
 *
 * Body esperado:
 * {
 *   "name": "João Silva",
 *   "phone": "5511999998888",      // DDI + DDD + número
 *   "scheduledAt": "2026-03-25T10:00:00-03:00",
 *   "title": "Reunião de Apresentação de Negócios",  // opcional — usa o padrão do cliente
 *   "notes": "Veio pelo Instagram"                   // opcional
 * }
 *
 * Resposta:
 * { "ok": true, "appointmentId": "...", "notifications": 4 }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const client = await prisma.client.findUnique({
    where: { webhookToken: params.token },
  })

  if (!client) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
  }

  let body: {
    name?: string
    phone?: string
    scheduledAt?: string
    title?: string
    notes?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido no body' }, { status: 400 })
  }

  const { name, phone, scheduledAt, title, notes } = body

  if (!name || !phone || !scheduledAt) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: name, phone, scheduledAt' },
      { status: 400 }
    )
  }

  const date = new Date(scheduledAt)
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: 'scheduledAt inválido — use ISO 8601' }, { status: 400 })
  }

  // Cria o agendamento
  const appointment = await prisma.appointment.create({
    data: {
      title: title || 'Reunião',
      customerName: name,
      customerPhone: phone,
      scheduledAt: date,
      notes: notes || null,
      clientId: client.id,
    },
  })

  // Agenda os lembretes automáticos (apenas os que ainda não passaram)
  await scheduleNotifications(appointment.id, date)

  const notifCount = await prisma.notification.count({
    where: { appointmentId: appointment.id },
  })

  return NextResponse.json({
    ok: true,
    appointmentId: appointment.id,
    customerName: name,
    scheduledAt: date.toISOString(),
    notifications: notifCount,
  })
}

/**
 * GET /api/webhook/:token
 * Retorna info básica para confirmar que o token é válido (útil para testar no n8n).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const client = await prisma.client.findUnique({
    where: { webhookToken: params.token },
    select: { name: true, instanceName: true },
  })

  if (!client) return NextResponse.json({ error: 'Token inválido' }, { status: 404 })

  return NextResponse.json({
    ok: true,
    client: client.name,
    instance: client.instanceName,
    message: 'Webhook ativo. Envie POST com name, phone e scheduledAt para criar agendamentos.',
  })
}
