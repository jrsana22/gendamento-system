import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/admin/campaigns - todas as campanhas de todos os clientes
export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      client: { select: { name: true } },
      _count: { select: { contacts: true } },
      contacts: { select: { status: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })
  return NextResponse.json(campaigns)
}
