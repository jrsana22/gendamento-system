import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/campaigns/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, clientId: session.clientId },
    include: {
      contacts: { orderBy: { dispatchOrder: 'asc' } },
    },
  })

  if (!campaign) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(campaign)
}

// DELETE /api/campaigns/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, clientId: session.clientId },
  })
  if (!campaign) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.campaign.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
