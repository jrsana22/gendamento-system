import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { client: true },
  })

  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.client?.name || 'Admin',
    clientId: user.client?.id,
  })
}
