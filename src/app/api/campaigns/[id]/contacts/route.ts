import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/campaigns/:id/contacts — adiciona contatos (suporta array)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, clientId: session.clientId },
    include: { _count: { select: { contacts: true } } },
  })
  if (!campaign) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  if (campaign.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Campanha já iniciada, não é possível adicionar contatos' }, { status: 400 })
  }

  const { contacts } = await req.json() as { contacts: { name: string; phone: string }[] }

  const startOrder = campaign._count.contacts + 1

  const created = await prisma.campaignContact.createMany({
    data: contacts.map((c, i) => ({
      campaignId: params.id,
      name: c.name,
      phone: c.phone,
      dispatchOrder: startOrder + i,
    })),
  })

  return NextResponse.json({ ok: true, created: created.count }, { status: 201 })
}

// DELETE /api/campaigns/:id/contacts — remove contato
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { contactId } = await req.json()
  await prisma.campaignContact.delete({ where: { id: contactId } })
  return NextResponse.json({ ok: true })
}
