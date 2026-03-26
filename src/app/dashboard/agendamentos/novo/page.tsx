'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Bell } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function NovoAgendamentoPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    customerName: '',
    customerPhone: '',
    scheduledAt: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      toast.error(data.error || 'Erro ao criar agendamento')
      return
    }

    toast.success('Agendamento criado! Lembretes automáticos configurados.')
    router.push('/dashboard/agendamentos')
  }

  // Horário mínimo: agora + 30 min
  const minDate = new Date(Date.now() + 30 * 60 * 1000)
    .toISOString()
    .slice(0, 16)

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/agendamentos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Novo agendamento</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Lembretes automáticos serão enviados via WhatsApp</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-1">Lembretes automáticos incluídos</p>
          <ul className="space-y-0.5 text-blue-700 dark:text-blue-400">
            <li>• 24 horas antes — lembrete do dia seguinte</li>
            <li>• 3 horas antes — confirmação no dia</li>
            <li>• 1 hora antes — aviso próximo</li>
            <li>• 15 minutos antes — "tudo certo?" final</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 space-y-5">
        <Input
          id="title"
          label="Título / tipo de encontro *"
          placeholder="ex: Consulta inicial, Reunião de briefing..."
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="customerName"
            label="Nome do cliente *"
            placeholder="Nome completo"
            value={form.customerName}
            onChange={(e) => set('customerName', e.target.value)}
            required
          />
          <Input
            id="customerPhone"
            label="WhatsApp do cliente *"
            placeholder="5511999999999"
            value={form.customerPhone}
            onChange={(e) => set('customerPhone', e.target.value)}
            required
          />
        </div>

        <Input
          id="scheduledAt"
          label="Data e horário *"
          type="datetime-local"
          min={minDate}
          value={form.scheduledAt}
          onChange={(e) => set('scheduledAt', e.target.value)}
          required
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Observações (opcional)
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Informações adicionais sobre o encontro..."
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard/agendamentos">
            <Button type="button" variant="secondary">Cancelar</Button>
          </Link>
          <Button type="submit" loading={saving}>
            Criar agendamento
          </Button>
        </div>
      </form>
    </div>
  )
}
