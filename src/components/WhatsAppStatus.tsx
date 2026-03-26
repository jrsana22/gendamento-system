'use client'

import { useEffect, useState } from 'react'

export function WhatsAppStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')

  useEffect(() => {
    fetch('/api/whatsapp/status')
      .then(r => r.json())
      .then(d => setStatus(d.connected ? 'connected' : 'disconnected'))
      .catch(() => setStatus('disconnected'))

    // Atualiza a cada 60s
    const interval = setInterval(() => {
      fetch('/api/whatsapp/status')
        .then(r => r.json())
        .then(d => setStatus(d.connected ? 'connected' : 'disconnected'))
        .catch(() => setStatus('disconnected'))
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  if (status === 'loading') return null

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
      status === 'connected'
        ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
        : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
    }`}>
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
        status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      }`} />
      WhatsApp {status === 'connected' ? 'conectado' : 'desconectado'}
    </div>
  )
}
