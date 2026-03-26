'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export function FailedNotifAlert() {
  const [count, setCount] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/appointments')
      .then(r => r.json())
      .then((data: { notifications?: { status: string }[] }[]) => {
        const failed = data.flatMap(a => a.notifications ?? []).filter(n => n.status === 'FAILED').length
        setCount(failed)
      })
      .catch(() => {})
  }, [])

  if (count === 0 || dismissed) return null

  return (
    <div className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          <strong>{count} lembrete{count > 1 ? 's' : ''}</strong> falhou no disparo via WhatsApp.
          Verifique se a instância está conectada.
        </span>
      </div>
      <button onClick={() => setDismissed(true)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
