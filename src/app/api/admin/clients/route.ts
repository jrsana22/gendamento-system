import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

// GET /api/admin/clients - lista todos os clientes
export async function GET() {
  const clients = await prisma.client.findMany({
    include: {
      user: { select: { email: true } },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(clients)
}

// POST /api/admin/clients - cria cliente + usuário
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, password, instanceName, evoUrl, apiKey, phone } = body

  if (!name || !email || !password || !instanceName || !evoUrl || !apiKey) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'CLIENT',
      client: {
        create: { name, instanceName, evoUrl, apiKey, phone },
      },
    },
    include: { client: true },
  })

  return NextResponse.json({ ok: true, userId: user.id, clientId: user.client?.id }, { status: 201 })
}
