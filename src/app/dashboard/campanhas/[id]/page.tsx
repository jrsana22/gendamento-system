'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'
import {
  ArrowLeft, Users, Send, CheckCircle, XCircle,
  Clock, RefreshCw, Loader2, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Contact {
  id: string
  name: string
  phone: string
  dispatchOrder: number
  status: string
  sentAt: string | null
  confirmedAt: string | null
  error: string | null
  appointmentId: string | null
}

interface Campaign {
  id: string
  title: string
  description: string | null
  scheduledAt: string
  status: string
  isRecurring: boolean
  recurDays: number | null
  contacts: Contact[]
}

const contactStatusConfig: Record<string, {
  label: string
  variant: 'gray' | 'yellow' | 'blue' | 'green' | 'red'
  icon: React.ComponentType<{ className?: string }>
}> = {
  PENDING:   { label: 'Pendente',    variant: 'gray',   icon: Clock },
  QUEUED:    { label: 'Na fila',     variant: 'yellow', icon: Loader2 },
  SENT:      { label: 'Enviado',     variant: 'blue',   icon: Send },
  FAILED:    { label: 'Falhou',      variant: 'red',    icon: AlertCircle },
  CONFIRMED: { label: 'Confirmado',  variant: 'green',  icon: CheckCircle },
  DECLINED:  { label: 'Não vai',     variant: 'red',    icon: XCircle },
}

export default function CampaignDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const fetchCampaign = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${id}`)
    if (res.ok) setCampaign(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { fetchCampaign() }, [fetchCampaign])

  // Auto-refresh quando estiver enviando
  useEffect(() => {
    if (campaign?.status !== 'SENDING') return
    const interval = setInterval(fetchCampaign, 30_000) // atualiza a cada 30s
    return () => clearInterval(interval)
  }, [campaign?.status, fetchCampaign])

  async function handleStart() {
    if (!confirm(`Iniciar o disparo? ${campaign!.contacts.length} mensagens serão enviadas, 1 por minuto.`)) return
    const res = await fetch(`/api/campaigns/${id}/start`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) { toast.success(data.message); fetchCampaign() }
    else toast.error(data.error)
  }

  async function handleConfirm(contactId: string) {
    setActing(contactId)
    const res = await fetch(`/api/campaigns/${id}/contacts/${contactId}/confirm`, { method: 'POST' })
    const data = await res.json()
    setActing(null)
    if (res.ok) { toast.success('Confirmado! Agendamento e lembretes criados.'); fetchCampaign() }
    else toast.error(data.error)
  }

  async function handleDecline(contactId: string) {
    setActing(contactId)
    const res = await fetch(`/api/campaigns/${id}/contacts/${contactId}/confirm`, { method: 'DELETE' })
    setActing(null)
    if (res.ok) { toast.success('Marcado como não confirmado'); fetchCampaign() }
    else toast.error('Erro ao atualizar')
  }

  if (loading) return <div className="py-20 text-center text-gray-400 dark:text-slate-500">Carregando...</div>
  if (!campaign) return <div className="py-20 text-center text-gray-400 dark:text-slate-500">Campanha não encontrada</div>

  const contacts = campaign.contacts
  const total = contacts.length
  const sent = contacts.filter((c) => ['SENT', 'CONFIRMED', 'DECLINED'].includes(c.status)).length
  const confirmed = contacts.filter((c) => c.status === 'CONFIRMED').length
  const queued = contacts.filter((c) => c.status === 'QUEUED').length
  const remaining = queued + contacts.filter((c) => c.status === 'PENDING').length
  const pendingStart = contacts.filter((c) => c.status === 'PENDING').length

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/campanhas">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{campaign.title}</h1>
            {campaign.isRecurring && (
              <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 rounded-full px-2 py-0.5 border border-purple-200">
                <RefreshCw className="h-3 w-3" /> Semanal a cada {campaign.recurDays}d
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{formatDateTime(campaign.scheduledAt)}</p>
        </div>
        {campaign.status === 'DRAFT' && pendingStart > 0 && (
          <Button onClick={handleStart}>
            <Send className="h-4 w-4" /> Iniciar disparo
          </Button>
        )}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, icon: Users, color: 'text-gray-600 dark:text-slate-400', bg: 'bg-gray-50 dark:bg-slate-800/50' },
          { label: 'Enviados', value: sent, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Confirmados', value: confirmed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Na fila', value: remaining, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de progresso */}
      {campaign.status === 'SENDING' && total > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-700 dark:text-slate-300 font-medium">Progresso do disparo</span>
            <span className="text-gray-500 dark:text-slate-400">{sent}/{total} · ~{remaining} min restantes</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${total > 0 ? (sent / total) * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Atualizando automaticamente a cada 30 segundos
          </p>
        </div>
      )}

      {/* Tabela de contatos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Contatos</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Confirme manualmente quem respondeu SIM para criar o agendamento e ativar os lembretes
          </p>
        </div>

        {contacts.length === 0 ? (
          <div className="py-12 text-center text-gray-400 dark:text-slate-500">Nenhum contato adicionado</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {contacts.map((c) => {
              const cfg = contactStatusConfig[c.status] ?? contactStatusConfig.PENDING
              const Icon = cfg.icon
              const isBusy = acting === c.id

              return (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 dark:text-slate-500 w-5 text-right">{c.dispatchOrder}</span>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{c.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {c.error && (
                      <span className="text-xs text-red-500 max-w-32 truncate" title={c.error}>
                        {c.error}
                      </span>
                    )}
                    {c.sentAt && (
                      <span className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block">
                        Enviado {new Date(c.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <Badge variant={cfg.variant}>
                      <Icon className="h-3 w-3 mr-1 inline" />
                      {cfg.label}
                    </Badge>

                    {/* Ações de confirmação — só para quem já recebeu */}
                    {c.status === 'SENT' && (
                      <div className="flex gap-1.5">
                        <Button size="sm" loading={isBusy} onClick={() => handleConfirm(c.id)}
                          className="text-xs">
                          <CheckCircle className="h-3.5 w-3.5" /> Confirmou
                        </Button>
                        <Button size="sm" variant="ghost" disabled={isBusy} onClick={() => handleDecline(c.id)}>
                          <XCircle className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />
                        </Button>
                      </div>
                    )}
                    {c.status === 'CONFIRMED' && c.appointmentId && (
                      <Link href="/dashboard/agendamentos">
                        <Button size="sm" variant="ghost" className="text-xs text-green-600">
                          Ver agenda
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
