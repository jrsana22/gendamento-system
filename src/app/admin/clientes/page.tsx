'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Pencil, Trash2, X, Users, Copy, Check, Link2, Bot } from 'lucide-react'
import toast from 'react-hot-toast'

interface Client {
  id: string
  name: string
  instanceName: string
  evoUrl: string
  apiKey: string
  phone: string | null
  agentWebhook: string | null
  webhookToken: string
  user: { email: string }
  _count: { appointments: number }
  createdAt: string
}

const EMPTY_FORM = {
  name: '', email: '', password: '',
  instanceName: '', evoUrl: '', apiKey: '', phone: '',
  agentWebhook: '',
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://agendamento.solucoesdeia.com'

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    const res = await fetch('/api/admin/clients')
    const data = await res.json()
    setClients(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  function webhookUrl(token: string) {
    return `${APP_URL}/api/webhook/${token}`
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success('URL copiada!')
    setTimeout(() => setCopied(null), 2000)
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(c: Client) {
    setForm({
      name: c.name,
      email: c.user.email,
      password: '',
      instanceName: c.instanceName,
      evoUrl: c.evoUrl,
      apiKey: c.apiKey,
      phone: c.phone || '',
      agentWebhook: c.agentWebhook || '',
    })
    setEditingId(c.id)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const url = editingId ? `/api/admin/clients/${editingId}` : '/api/admin/clients'
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      toast.error(data.error || 'Erro ao salvar')
      return
    }

    toast.success(editingId ? 'Cliente atualizado!' : 'Cliente criado!')
    setShowModal(false)
    fetchClients()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o cliente "${name}"? Todos os dados serão removidos.`)) return
    const res = await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Cliente excluído'); fetchClients() }
    else toast.error('Erro ao excluir')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Cada cliente tem uma URL webhook exclusiva para o agente n8n</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo cliente
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 dark:text-slate-500">Carregando...</div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-slate-500">
          <Users className="h-10 w-10 mb-3" />
          <p>Nenhum cliente cadastrado</p>
          <Button className="mt-4" onClick={openCreate} size="sm">
            <Plus className="h-4 w-4" /> Criar primeiro cliente
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {clients.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{c.name}</h3>
                    <span className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
                      {c._count.appointments} agendamentos
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{c.user.email} · instância: <code className="text-blue-700 font-mono">{c.instanceName}</code></p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(c.id, c.name)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Webhook do sistema — o n8n posta AQUI para criar agendamentos */}
              <div className="mt-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-800 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Link2 className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                    URL do Webhook para o agente n8n
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-blue-700 font-mono bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded px-3 py-2 truncate">
                    {webhookUrl(c.webhookToken)}
                  </code>
                  <button
                    onClick={() => copyText(webhookUrl(c.webhookToken), `sys-${c.id}`)}
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400 hover:text-blue-600 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded px-3 py-2 transition-colors"
                  >
                    {copied === `sys-${c.id}`
                      ? <><Check className="h-3.5 w-3.5 text-green-600" /> Copiado</>
                      : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                  Configure no n8n: HTTP Request → POST → body: name, phone, scheduledAt, title
                </p>
              </div>

              {/* Webhook do agente — URL do fluxo n8n/IA deste cliente */}
              {c.agentWebhook && (
                <div className="mt-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800/40 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Bot className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                      Webhook do Agente (n8n/IA)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-purple-700 dark:text-purple-300 font-mono bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/40 rounded px-3 py-2 truncate">
                      {c.agentWebhook}
                    </code>
                    <button
                      onClick={() => copyText(c.agentWebhook!, `agent-${c.id}`)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/40 rounded px-3 py-2 transition-colors"
                    >
                      {copied === `agent-${c.id}`
                        ? <><Check className="h-3.5 w-3.5 text-green-600" /> Copiado</>
                        : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Editar cliente' : 'Novo cliente'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nome do cliente *" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Input label="Telefone (WhatsApp)" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="5511999999999" />
              </div>

              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide pt-1">Acesso ao sistema</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="E-mail *" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editingId} required={!editingId} />
                <Input label={editingId ? 'Nova senha (opcional)' : 'Senha *'}
                  type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId} />
              </div>

              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide pt-1">Agente (n8n / IA)</p>
              <Input
                label="Webhook do Agente"
                value={form.agentWebhook}
                onChange={(e) => setForm({ ...form, agentWebhook: e.target.value })}
                placeholder="https://n8n.exemplo.com/webhook/abc123"
              />
              <p className="text-xs text-gray-400 dark:text-slate-500 -mt-2">
                URL do fluxo n8n/IA deste cliente. Os agendamentos enviados por ele virão para o painel deste cliente.
              </p>

              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide pt-1">Evolution API</p>
              <Input label="URL da Evolution *" value={form.evoUrl}
                onChange={(e) => setForm({ ...form, evoUrl: e.target.value })}
                placeholder="https://sua-evo.com" required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nome da instância *" value={form.instanceName}
                  onChange={(e) => setForm({ ...form, instanceName: e.target.value })} required />
                <Input label="API Key *" value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })} required />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit" loading={saving}>
                  {editingId ? 'Salvar' : 'Criar cliente'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
