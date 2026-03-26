import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      <Sidebar role="ADMIN" name="Administrador" />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 p-4 md:p-8 dark:bg-slate-950">{children}</main>
    </div>
  )
}
