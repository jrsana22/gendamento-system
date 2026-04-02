import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { scheduleNotifications } from '@/lib/notifications'

// GET /api/appointments - agendamentos do cliente logado
// ?archived=true para ver arquivados
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const archived = req.nextUrl.searchParams.get('archived') === 'true'

  const appointments = await prisma.appointment.findMany({
    where: { clientId: session.clientId, archived },
    include: { notifications: { orderBy: { scheduledAt: 'asc' } } },
    orderBy: { scheduledAt: 'asc' },
  })

  return NextResponse.json(appointments)
}

// POST /api/appointments - cria novo agendamento
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  let { title, customerName, customerPhone, scheduledAt, notes } = await req.json()

  if (!title || !customerName || !customerPhone || !scheduledAt) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 })
  }

  // Validar e formatar telefone
  const cleaned = String(customerPhone).replace(/\D/g, '')
  if (!cleaned.startsWith('55') || cleaned.length !== 13) {
    return NextResponse.json({
      error: 'WhatsApp inválido. Formato correto: 5511999999999 (código do país + número)'
    }, { status: 400 })
  }
  customerPhone = cleaned

  const date = new Date(scheduledAt)
  if (date <= new Date()) {
    return NextResponse.json({ error: 'A data deve ser no futuro' }, { status: 400 })
  }

  const appointment = await prisma.appointment.create({
    data: {
      title,
      customerName,
      customerPhone,
      scheduledAt: date,
      notes,
      clientId: session.clientId,
    },
  })

  // Agenda os lembretes automáticos
  await scheduleNotifications(appointment.id, date)

  return NextResponse.json(appointment, { status: 201 })
}
