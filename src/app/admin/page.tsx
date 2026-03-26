import { prisma } from '@/lib/db'
import { Users, Calendar, Bell, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [totalClients, totalAppointments, pendingNotifs, clients] = await Promise.all([
    prisma.client.count(),
    prisma.appointment.count(),
    prisma.notification.count({ where: { status: 'PENDING' } }),
    prisma.client.findMany({
      include: {
        appointments: {
          include: { notifications: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  const stats = [
    { label: 'Agentes', value: totalClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Agendamentos', value: totalAppointments, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Lembretes pendentes', value: pendingNotifs, icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>
        <p className="text-gray-500 mt-1">Visão geral de todos os agentes e agendamentos</p>
      </div>

      {/* Stats globais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Métricas por agente */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Desempenho por agente</h2>
          </div>
          <Link href="/admin/clientes" className="text-sm text-blue-600 hover:underline">Gerenciar agentes</Link>
        </div>

        {clients.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Nenhum agente cadastrado</div>
        ) : (
          <div className="overflow-x-auto -mx-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agente</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total leads</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agendados</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Compareceram</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Não compareceram</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Consultores</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Taxa comparec.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lembretes pend.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client) => {
                  const total = client.appointments.length
                  const scheduled = client.appointments.filter(a => a.status === 'SCHEDULED').length
                  const done = client.appointments.filter(a => a.status === 'DONE').length
                  const cancelled = client.appointments.filter(a => a.status === 'CANCELLED').length
                  const consultant = client.appointments.filter(a => a.status === 'CONSULTANT').length
                  const concluded = done + cancelled
                  const rate = concluded > 0 ? Math.round((done / concluded) * 100) : null
                  const pendingNotifCount = client.appointments.flatMap(a => a.notifications).filter(n => n.status === 'PENDING').length

                  return (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                            {client.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-xs text-gray-400">{client.instanceName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-gray-900">{total}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{scheduled}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">{done}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-block bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">{cancelled}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-block bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">{consultant}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {rate !== null ? (
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                            rate >= 70 ? 'bg-green-100 text-green-700' :
                            rate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {rate}%
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {pendingNotifCount > 0 ? (
                          <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">{pendingNotifCount}</span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
