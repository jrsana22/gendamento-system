'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'
import { Megaphone, Plus, Users, Send, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Campaign {
  id: string
  title: string
  description: string | null
  scheduledAt: string
  status: string
  isRecurring: boolean
  recurDays: number | null
  _count: { contacts: number }
  contacts: { status: string }[]
}

const statusConfig: Record<string, { label: string; variant: 'gray' | 'blue' | 'green' | 'red' | 'yellow' }> = {
  DRAFT:     { label: 'Rascunho',  variant: 'gray' },
  SENDING:   { label: 'Enviando',  variant: 'yellow' },
  SENT:      { label: 'Enviado',   variant: 'green' },
  CANCELLED: { label: 'Cancelado', variant: 'red' },
}

export default function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = useCallback(async () => {
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setCampaigns(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  async function handleStart(id: string, title: string) {
    if (!confirm(`Iniciar o disparo da campanha "${title}"? As mensagens serão enviadas 1 por minuto.`)) return

    const res = await fetch(`/api/campaigns/${id}/start`, { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      toast.success(data.message)
      fetchCampaigns()
    } else {
      toast.error(data.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campanhas</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Disparo em massa com intervalo de 1 min/pessoa para evitar banimento</p>
        </div>
        <Link href="/dashboard/campanhas/nova">
          <Button><Plus className="h-4 w-4" /> Nova campanha</Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 dark:text-slate-500">Carregando...</div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-500">
          <Megaphone className="h-12 w-12 mb-3" />
          <p>Nenhuma campanha criada</p>
          <Link href="/dashboard/campanhas/nova">
            <Button className="mt-4" size="sm"><Plus className="h-4 w-4" /> Criar primeira campanha</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const sent = c.contacts.filter((x) => ['SENT', 'CONFIRMED', 'DECLINED'].includes(x.status)).length
            const confirmed = c.contacts.filter((x) => x.status === 'CONFIRMED').length
            const total = c._count.contacts
            const cfg = statusConfig[c.status] ?? statusConfig.DRAFT

            return (
              <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4">
                {/* Row 1: title + badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-gray-900 dark:text-white leading-tight">{c.title}</h2>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      {c.isRecurring && (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 rounded-full px-2 py-0.5 border border-purple-200 dark:border-purple-900">
                          <RefreshCw className="h-3 w-3" /> Semanal
                        </span>
                      )}
                    </div>
                    {c.description && (
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{c.description}</p>
                    )}
                  </div>
                </div>

                {/* Row 2: meta info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {formatDateTime(c.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {total} contatos
                  </span>
                  {total > 0 && (
                    <span className="flex items-center gap-1">
                      <Send className="h-3.5 w-3.5" /> {sent}/{total} enviados
                    </span>
                  )}
                  {confirmed > 0 && (
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle className="h-3.5 w-3.5" /> {confirmed} confirmados
                    </span>
                  )}
                </div>

                {/* Row 3: actions */}
                <div className="flex items-center gap-2">
                  {c.status === 'DRAFT' && total > 0 && (
                    <Button size="sm" onClick={() => handleStart(c.id, c.title)} className="flex-1 sm:flex-none justify-center">
                      <Send className="h-3.5 w-3.5" /> Iniciar disparo
                    </Button>
                  )}
                  <Link href={`/dashboard/campanhas/${c.id}`} className="flex-1 sm:flex-none">
                    <Button size="sm" variant="secondary" className="w-full justify-center">Ver detalhes</Button>
                  </Link>
                </div>

                {/* Barra de progresso */}
                {c.status === 'SENDING' && total > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-1">
                      <span>Progresso do disparo</span>
                      <span>{Math.round((sent / total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(sent / total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
