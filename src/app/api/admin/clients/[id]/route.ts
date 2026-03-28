import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/clients/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { email: true } },
      appointments: {
        orderBy: { scheduledAt: 'desc' },
        take: 10,
        include: { notifications: true },
      },
    },
  })
  if (!client) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(client)
}

// PUT /api/admin/clients/:id - atualiza dados do cliente
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, instanceName, evoUrl, apiKey, phone, agentWebhook } = await req.json()

  const client = await prisma.client.update({
    where: { id: params.id },
    data: { name, instanceName, evoUrl, apiKey, phone, agentWebhook: agentWebhook || null },
  })

  return NextResponse.json(client)
}

// DELETE /api/admin/clients/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.id } })
  if (!client) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.user.delete({ where: { id: client.userId } })
  return NextResponse.json({ ok: true })
}
