import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const appointments = await prisma.appointment.findMany({
    where: { clientId: session.clientId },
    include: { notifications: { orderBy: { scheduledAt: 'asc' } } },
    orderBy: { scheduledAt: 'asc' },
  })

  const rows = [
    ['Nome', 'Telefone', 'Serviço', 'Data/Hora', 'Status', 'Lembretes enviados', 'Observações'],
    ...appointments.map((a) => {
      const sent = a.notifications.filter(n => n.status === 'SENT').length
      const total = a.notifications.length
      return [
        a.customerName,
        a.customerPhone,
        a.title,
        new Date(a.scheduledAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        a.status,
        `${sent}/${total}`,
        a.notes || '',
      ]
    }),
  ]

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')

  return new NextResponse('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="agendamentos.csv"',
    },
  })
}
