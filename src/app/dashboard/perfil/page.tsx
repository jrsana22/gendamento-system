'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { User, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PerfilPage() {
  const [profile, setProfile] = useState({ name: '', phone: '', email: '' })
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      setProfile({ name: d.name || '', phone: d.phone || '', email: d.email || '' })
      setLoadingProfile(false)
    })
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile.name, phone: profile.phone }),
    })
    setSavingProfile(false)
    res.ok ? toast.success('Perfil atualizado') : toast.error('Erro ao salvar')
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    setSavingPw(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    })
    const data = await res.json()
    setSavingPw(false)
    if (res.ok) {
      toast.success('Senha alterada com sucesso')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } else {
      toast.error(data.error || 'Erro ao alterar senha')
    }
  }

  if (loadingProfile) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Gerencie suas informações e senha de acesso</p>
      </div>

      {/* Dados do perfil */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Informações pessoais</h2>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Nome"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            value={profile.email}
            disabled
            className="bg-gray-50 text-gray-400 cursor-not-allowed"
          />
          <Input
            label="Telefone (WhatsApp)"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            placeholder="55119..."
          />
          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>Salvar alterações</Button>
          </div>
        </form>
      </div>

      {/* Alterar senha */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="h-9 w-9 rounded-full bg-yellow-100 dark:bg-yellow-950/60 flex items-center justify-center">
            <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Alterar senha</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Senha atual"
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            required
          />
          <Input
            label="Nova senha"
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            required
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" loading={savingPw}>Alterar senha</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
