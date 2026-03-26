import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const hash = await bcrypt.hash('Felipesamuel2@', 12)

    const user = await prisma.user.upsert({
      where: { email: 'jrsana@yahoo.com.br' },
      update: { password: hash, role: 'ADMIN' },
      create: {
        email: 'jrsana@yahoo.com.br',
        password: hash,
        role: 'ADMIN',
      },
    })

    return NextResponse.json({ ok: true, message: 'Usuário admin criado/atualizado.', id: user.id })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
