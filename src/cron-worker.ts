/**
 * Worker de cron local — rode em paralelo com `next dev`.
 * Uso: npm run cron
 *
 * Em produção no Vercel, os cron jobs são nativos (vercel.json).
 * Em VPS com Docker, o container `cron` executa este arquivo.
 */

import cron from 'node-cron'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret-local'

const cronHeaders = { 'x-cron-secret': CRON_SECRET }

async function run(path: string, label: string) {
  try {
    const res = await fetch(`${APP_URL}${path}`, { headers: cronHeaders })
    const data = await res.json()
    const time = new Date().toLocaleTimeString('pt-BR')

    if (label === 'notifications' && data.processed > 0) {
      console.log(`[${time}] [notificações] ${data.sent} enviados, ${data.failed} falharam de ${data.processed}`)
    }
    if (label === 'campaigns' && (data.sent > 0 || data.failed > 0)) {
      console.log(`[${time}] [campanhas] ${data.sent} enviados, ${data.failed} falharam`)
    }
  } catch (err) {
    console.error(`[cron/${label}] Erro:`, err)
  }
}

console.log('🔔 Cron worker iniciado — processando a cada minuto')
console.log(`   App: ${APP_URL}`)

// Executa imediatamente ao iniciar
run('/api/cron/notifications', 'notifications')
run('/api/cron/campaigns', 'campaigns')

// Depois executa a cada minuto
cron.schedule('* * * * *', () => {
  run('/api/cron/notifications', 'notifications')
  run('/api/cron/campaigns', 'campaigns')
})
