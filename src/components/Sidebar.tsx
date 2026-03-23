'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Calendar, Users, LayoutDashboard, LogOut, Bell, Megaphone } from 'lucide-react'

interface SidebarProps {
  role: 'ADMIN' | 'CLIENT'
  name: string
}

export function Sidebar({ role, name }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/clientes', label: 'Clientes', icon: Users },
    { href: '/admin/agendamentos', label: 'Agendamentos', icon: Calendar },
    { href: '/admin/campanhas', label: 'Campanhas', icon: Megaphone },
  ]

  const clientLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/agendamentos', label: 'Agendamentos', icon: Calendar },
    { href: '/dashboard/campanhas', label: 'Campanhas', icon: Megaphone },
    { href: '/dashboard/notificacoes', label: 'Notificações', icon: Bell },
  ]

  const links = role === 'ADMIN' ? adminLinks : clientLinks

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">Agendamentos</span>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-gray-100">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">Logado como</p>
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <span className="text-xs text-blue-600 font-medium">
            {role === 'ADMIN' ? 'Administrador' : 'Cliente'}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
