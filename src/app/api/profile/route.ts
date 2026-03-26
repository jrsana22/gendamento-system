import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    include: { user: { select: { email: true } } },
  })
  if (!client) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({ name: client.name, phone: client.phone, email: client.user.email })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { name, phone, currentPassword, newPassword } = await req.json()

  if (name) {
    await prisma.client.update({ where: { id: session.clientId }, data: { name, phone } })
  }

  if (newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    const valid = await bcrypt.compare(currentPassword || '', user.password)
    if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: session.userId }, data: { password: hash } })
  }

  return NextResponse.json({ ok: true })
}
