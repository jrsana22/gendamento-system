import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { client: true },
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role as 'ADMIN' | 'CLIENT',
    clientId: user.client?.id,
  })

  const res = NextResponse.json({
    ok: true,
    role: user.role,
    name: user.client?.name || 'Admin',
  })

  const isProd = process.env.NODE_ENV === 'production'

  res.cookies.set('session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })

  return res
}
