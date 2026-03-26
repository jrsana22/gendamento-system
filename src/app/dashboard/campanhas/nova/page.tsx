'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Plus, Trash2, Upload, Info } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const DEFAULT_TEMPLATE = `Olá, {nome}! 👋

Gostaríamos muito de te convidar para *{titulo}*.

📅 Data: {data}
⏰ Horário: {horario}

É um encontro presencial e ficamos felizes em ter você! 😊

Para confirmar sua presença, responda *SIM*.
Qualquer dúvida é só chamar. Até lá!`

interface Contact {
  name: string
  phone: string
}

export default function NovaCampanhaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    messageTemplate: DEFAULT_TEMPLATE,
    isRecurring: false,
    recurDays: 7,
  })
  const [contacts, setContacts] = useState<Contact[]>([{ name: '', phone: '' }])

  function set(field: string, value: string | boolean | number) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function setContact(index: number, field: 'name' | 'phone', value: string) {
    setContacts((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  function addContact() {
    setContacts((prev) => [...prev, { name: '', phone: '' }])
  }

  function removeContact(index: number) {
    setContacts((prev) => prev.filter((_, i) => i !== index))
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.trim().split('\n').slice(1) // pula header
      const parsed = lines
        .map((line) => {
          const [name, phone] = line.split(',').map((s) => s.trim().replace(/"/g, ''))
          return { name, phone }
        })
        .filter((c) => c.name && c.phone)

      setContacts((prev) => {
        const existing = prev.filter((c) => c.name || c.phone)
        return [...existing, ...parsed]
      })
      toast.success(`${parsed.length} contatos importados do CSV`)
    }
    reader.readAsText(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validContacts = contacts.filter((c) => c.name && c.phone)
    if (validContacts.length === 0) {
      toast.error('Adicione pelo menos um contato')
      return
    }

    setSaving(true)
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        recurDays: form.isRecurring ? form.recurDays : null,
        contacts: validContacts,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      toast.error(data.error || 'Erro ao criar campanha')
      return
    }

    toast.success('Campanha criada! Revise os contatos e inicie o disparo.')
    router.push(`/dashboard/campanhas/${data.id}`)
  }

  const minDate = new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/campanhas">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova campanha</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Disparo em massa · 1 mensagem por minuto por contato</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados da campanha */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-slate-200">Dados do encontro</h2>
          <Input label="Título do encontro *" value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="ex: Reunião de Apresentação de Negócios" required />
          <Input label="Descrição (opcional)" value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Detalhes adicionais para uso interno" />
          <Input label="Data e horário do encontro *" type="datetime-local"
            min={minDate} value={form.scheduledAt}
            onChange={(e) => set('scheduledAt', e.target.value)} required />

          <div className="flex items-start gap-3 pt-1">
            <input type="checkbox" id="recurring" checked={form.isRecurring}
              onChange={(e) => set('isRecurring', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="recurring" className="text-sm text-gray-700 dark:text-slate-300 cursor-pointer">
              <span className="font-medium">Recorrência automática</span>
              <span className="text-gray-500 dark:text-slate-400 block mt-0.5">
                Ao terminar o disparo, cria a próxima campanha automaticamente
              </span>
            </label>
          </div>

          {form.isRecurring && (
            <div className="ml-7">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Repetir a cada</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="number" min={1} max={365} value={form.recurDays}
                  onChange={(e) => set('recurDays', parseInt(e.target.value))}
                  className="w-20 rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <span className="text-sm text-gray-600 dark:text-slate-400">dias (7 = semanal)</span>
              </div>
            </div>
          )}
        </div>

        {/* Template da mensagem */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-slate-200">Mensagem de convite</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Variáveis disponíveis no template</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['{nome}', '{data}', '{horario}', '{titulo}'].map((v) => (
              <code key={v} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 font-mono">
                {v}
              </code>
            ))}
          </div>

          <textarea rows={10} value={form.messageTemplate}
            onChange={(e) => set('messageTemplate', e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required />

          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <p>Após o envio, quando o contato responder <strong>SIM</strong>, você confirma manualmente no painel e o sistema cria o agendamento com os 4 lembretes automáticos.</p>
          </div>
        </div>

        {/* Lista de contatos */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-slate-200">Contatos</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {contacts.filter((c) => c.name && c.phone).length} válidos
                {contacts.length > 1 && ` · estimativa ${contacts.filter((c) => c.name && c.phone).length} min de disparo`}
              </p>
            </div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                <Upload className="h-4 w-4" /> Importar CSV
              </span>
              <input type="file" accept=".csv" onChange={handleCSV} className="hidden" />
            </label>
          </div>

          <div className="text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
            Formato CSV: <code className="font-mono">nome,telefone</code> (WhatsApp com DDI, ex: 5511999999999)
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {contacts.map((c, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-xs text-gray-400 dark:text-slate-500 mt-2.5 w-5 text-right flex-shrink-0">{i + 1}</span>
                <Input placeholder="Nome completo" value={c.name}
                  onChange={(e) => setContact(i, 'name', e.target.value)} />
                <Input placeholder="5511999999999" value={c.phone}
                  onChange={(e) => setContact(i, 'phone', e.target.value)} />
                {contacts.length > 1 && (
                  <button type="button" onClick={() => removeContact(i)}
                    className="mt-1.5 text-gray-400 dark:text-slate-500 hover:text-red-500 flex-shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={addContact}>
            <Plus className="h-4 w-4" /> Adicionar contato
          </Button>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/campanhas">
            <Button type="button" variant="secondary">Cancelar</Button>
          </Link>
          <Button type="submit" loading={saving}>Criar campanha</Button>
        </div>
      </form>
    </div>
  )
}
