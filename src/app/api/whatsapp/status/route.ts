import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session?.clientId) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const client = await prisma.client.findUnique({ where: { id: session.clientId } })
  if (!client) return NextResponse.json({ connected: false })

  try {
    const res = await fetch(
      `${client.evoUrl}/instance/connectionState/${client.instanceName}`,
      { headers: { apikey: client.apiKey }, cache: 'no-store' }
    )
    if (!res.ok) return NextResponse.json({ connected: false })
    const data = await res.json()
    const connected = data?.instance?.state === 'open'
    return NextResponse.json({ connected })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
