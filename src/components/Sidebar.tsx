'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Calendar, Users, LayoutDashboard, LogOut, Bell,
  KanbanSquare, UserCircle, Megaphone, Sun, Moon,
} from 'lucide-react'
import { WhatsAppStatus } from './WhatsAppStatus'
import { useTheme } from './ThemeProvider'

interface SidebarProps {
  role: 'ADMIN' | 'CLIENT'
  name: string
}

export function Sidebar({ role, name }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle } = useTheme()

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/clientes', label: 'Clientes', icon: Users },
    { href: '/admin/agendamentos', label: 'Agendamentos', icon: Calendar },
    { href: '/admin/crm', label: 'Acomp. de Leads', icon: KanbanSquare },
  ]

  const clientLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/agendamentos', label: 'Agendamentos', icon: Calendar },
    { href: '/dashboard/crm', label: 'Acomp. de Leads', icon: KanbanSquare },
    { href: '/dashboard/campanhas', label: 'Campanhas', icon: Megaphone },
    { href: '/dashboard/notificacoes', label: 'Notificações', icon: Bell },
    { href: '/dashboard/perfil', label: 'Meu Perfil', icon: UserCircle },
  ]

  // Bottom nav mobile — 5 tabs mais usados
  const mobileLinks = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/dashboard/agendamentos', label: 'Agenda', icon: Calendar },
    { href: '/dashboard/crm', label: 'Leads', icon: KanbanSquare },
    { href: '/dashboard/campanhas', label: 'Campanhas', icon: Megaphone },
    { href: '/dashboard/notificacoes', label: 'Notif.', icon: Bell },
  ]

  const links = role === 'ADMIN' ? adminLinks : clientLinks

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard' || href === '/admin') return pathname === href
    return pathname.startsWith(href)
  }

  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside className="hidden md:flex h-screen w-60 flex-col border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 dark:border-slate-800 px-5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">
            Agendamentos
          </span>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="rounded-xl bg-gray-50 dark:bg-slate-800 px-3 py-2.5 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-slate-400">Logado como</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {role === 'ADMIN' ? 'Administrador' : 'Agente'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive(href)
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-slate-800 space-y-1">
          {role === 'CLIENT' && (
            <div className="px-1 pb-2">
              <WhatsAppStatus />
            </div>
          )}

          <button
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-all duration-150"
          >
            {theme === 'dark'
              ? <Sun className="h-4 w-4" />
              : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400 transition-all duration-150"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ──────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Calendar className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">Agendamentos</span>
        </div>

        {/* Right side: tema + avatar */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggle}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link
            href="/dashboard/perfil"
            className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-all"
            aria-label="Meu Perfil"
          >
            <span className="text-white text-xs font-bold">{initials}</span>
          </Link>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────── */}
      {role === 'CLIENT' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 pb-safe">
          <div className="flex items-stretch">
            {mobileLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all duration-150 relative',
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-slate-500'
                  )}
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
                  )}
                  <Icon className={cn('h-5 w-5 transition-transform duration-150', active && 'scale-110')} />
                  <span className="text-[10px] font-semibold leading-none">{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </>
  )
}
