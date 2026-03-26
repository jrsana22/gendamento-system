import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Sidebar } from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'ADMIN') redirect('/admin')

  const client = session.clientId
    ? await prisma.client.findUnique({ where: { id: session.clientId }, select: { name: true } })
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      <Sidebar role="CLIENT" name={client?.name || session.email} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 pb-20 md:pb-0 p-4 md:p-8 dark:bg-slate-950">{children}</main>
    </div>
  )
}
