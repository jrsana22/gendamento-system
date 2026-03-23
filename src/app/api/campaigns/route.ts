import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/campaigns
export async function GET() {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const campaigns = await prisma.campaign.findMany({
    where: { clientId: session.clientId },
    include: {
      _count: { select: { contacts: true } },
      contacts: { select: { status: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  return NextResponse.json(campaigns)
}

// POST /api/campaigns
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { title, description, scheduledAt, messageTemplate, isRecurring, recurDays, contacts } = await req.json()

  if (!title || !scheduledAt || !messageTemplate) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 })
  }

  const campaign = await prisma.campaign.create({
    data: {
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      messageTemplate,
      isRecurring: !!isRecurring,
      recurDays: isRecurring ? recurDays : null,
      clientId: session.clientId,
      contacts: contacts?.length
        ? {
            create: contacts.map((c: { name: string; phone: string }, i: number) => ({
              name: c.name,
              phone: c.phone,
              dispatchOrder: i + 1,
            })),
          }
        : undefined,
    },
    include: { contacts: true },
  })

  return NextResponse.json(campaign, { status: 201 })
}
