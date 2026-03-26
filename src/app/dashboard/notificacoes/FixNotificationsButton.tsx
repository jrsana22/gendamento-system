'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function FixNotificationsButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleFix() {
    setLoading(true)
    const res = await fetch('/api/appointments/fix-notifications', { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (data.fixed > 0) {
      toast.success(`${data.fixed} agendamento(s) corrigido(s) — lembretes gerados!`)
      router.refresh()
    } else {
      toast('Nenhum agendamento sem lembrete encontrado', { icon: 'ℹ️' })
    }
  }

  return (
    <button
      onClick={handleFix}
      disabled={loading}
      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Gerando...' : 'Gerar lembretes pendentes'}
    </button>
  )
}
