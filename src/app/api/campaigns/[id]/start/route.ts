import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/campaigns/:id/start
 *
 * Inicia o disparo da campanha: marca todos os contatos como QUEUED
 * e a campanha como SENDING. O cron processa 1 por minuto por campanha.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, clientId: session.clientId },
    include: { contacts: { orderBy: { dispatchOrder: 'asc' } } },
  })

  if (!campaign) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  if (campaign.status !== 'DRAFT') {
    return NextResponse.json({ error: `Campanha já está com status ${campaign.status}` }, { status: 400 })
  }
  if (campaign.contacts.length === 0) {
    return NextResponse.json({ error: 'Adicione contatos antes de iniciar o disparo' }, { status: 400 })
  }

  // Marca todos como QUEUED e campanha como SENDING
  await prisma.$transaction([
    prisma.campaignContact.updateMany({
      where: { campaignId: params.id, status: 'PENDING' },
      data: { status: 'QUEUED' },
    }),
    prisma.campaign.update({
      where: { id: params.id },
      data: { status: 'SENDING' },
    }),
  ])

  return NextResponse.json({
    ok: true,
    message: `Disparo iniciado para ${campaign.contacts.length} contatos. 1 mensagem por minuto.`,
    estimatedMinutes: campaign.contacts.length,
  })
}
