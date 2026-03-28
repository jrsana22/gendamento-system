import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// DELETE /api/admin/appointments/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const appt = await prisma.appointment.findUnique({ where: { id: params.id } })
  if (!appt) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.appointment.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
