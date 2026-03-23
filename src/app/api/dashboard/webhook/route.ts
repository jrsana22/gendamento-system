import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    select: { webhookToken: true, instanceName: true },
  })

  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agendamento.solucoesdeia.com'

  return NextResponse.json({
    webhookUrl: `${appUrl}/api/webhook/${client.webhookToken}`,
    instanceName: client.instanceName,
  })
}
