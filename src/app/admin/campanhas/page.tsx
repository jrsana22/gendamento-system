import { prisma } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Megaphone } from 'lucide-react'

export const dynamic = 'force-dynamic'

const statusConfig: Record<string, { label: string; variant: 'gray' | 'yellow' | 'green' | 'red' }> = {
  DRAFT:     { label: 'Rascunho',  variant: 'gray' },
  SENDING:   { label: 'Enviando',  variant: 'yellow' },
  SENT:      { label: 'Enviado',   variant: 'green' },
  CANCELLED: { label: 'Cancelado', variant: 'red' },
}

export default async function AdminCampanhasPage() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      client: { select: { name: true } },
      contacts: { select: { status: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campanhas</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Todas as campanhas de disparo de todos os clientes</p>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-500">
          <Megaphone className="h-12 w-12 mb-3" />
          <p>Nenhuma campanha criada</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
              <tr>
                {['Campanha', 'Cliente', 'Data do encontro', 'Contatos', 'Enviados', 'Confirmados', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {campaigns.map((c) => {
                const total = c.contacts.length
                const sent = c.contacts.filter((x) => ['SENT', 'CONFIRMED', 'DECLINED'].includes(x.status)).length
                const confirmed = c.contacts.filter((x) => x.status === 'CONFIRMED').length
                const cfg = statusConfig[c.status] ?? statusConfig.DRAFT

                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:bg-slate-800/50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{c.title}</p>
                      {c.contacts.filter((x) => x.status === 'SENDING').length > 0 && (
                        <div className="mt-1 h-1 bg-gray-100 dark:bg-slate-800 rounded-full w-32">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(sent / total) * 100}%` }} />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-slate-400">{c.client.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-slate-400">{formatDateTime(c.scheduledAt)}</td>
                    <td className="px-5 py-4 text-sm text-gray-900 dark:text-white font-medium">{total}</td>
                    <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">{sent}/{total}</td>
                    <td className="px-5 py-4 text-sm text-green-700 font-medium">{confirmed}</td>
                    <td className="px-5 py-4">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
