import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/evolution'
import { addDays } from 'date-fns'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/campaigns
 *
 * Processa a fila de disparo das campanhas.
 * Regra: envia 1 mensagem por minuto por campanha (1 contato QUEUED por execução por campanha).
 *
 * Protegido por x-cron-secret / Authorization: Bearer no middleware.
 */
export async function GET() {
  // Campanhas em andamento
  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: 'SENDING' },
    include: {
      client: true,
      contacts: {
        where: { status: 'QUEUED' },
        orderBy: { dispatchOrder: 'asc' },
        take: 1, // 1 por execução por campanha
      },
    },
  })

  if (activeCampaigns.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  let totalSent = 0
  let totalFailed = 0

  for (const campaign of activeCampaigns) {
    const contact = campaign.contacts[0]

    if (!contact) {
      // Sem mais contatos na fila — campanha concluída
      await finalizeCampaign(campaign)
      continue
    }

    const message = buildCampaignMessage(
      campaign.messageTemplate,
      contact.name,
      campaign.scheduledAt,
      campaign.title
    )

    const result = await sendWhatsAppMessage({
      evoUrl: campaign.client.evoUrl,
      apiKey: campaign.client.apiKey,
      instanceName: campaign.client.instanceName,
      to: contact.phone,
      text: message,
    })

    await prisma.campaignContact.update({
      where: { id: contact.id },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: result.success ? new Date() : null,
        error: result.error ?? null,
      },
    })

    if (result.success) {
      totalSent++
      console.log(`[cron/campaigns] ✅ ${campaign.title} → ${contact.name} (${contact.phone})`)
    } else {
      totalFailed++
      console.error(`[cron/campaigns] ❌ ${campaign.title} → ${contact.name}: ${result.error}`)
    }

    // Verifica se foi o último contato
    const remaining = await prisma.campaignContact.count({
      where: { campaignId: campaign.id, status: 'QUEUED' },
    })
    if (remaining === 0) {
      await finalizeCampaign(campaign)
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, failed: totalFailed })
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function finalizeCampaign(campaign: {
  id: string
  title: string
  scheduledAt: Date
  messageTemplate: string
  isRecurring: boolean
  recurDays: number | null
  clientId: string
}) {
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: 'SENT' },
  })

  // Recorrência: cria a próxima campanha automaticamente
  if (campaign.isRecurring && campaign.recurDays) {
    const nextDate = addDays(campaign.scheduledAt, campaign.recurDays)

    // Copia os contatos originais para a nova campanha (com PENDING)
    const contacts = await prisma.campaignContact.findMany({
      where: { campaignId: campaign.id },
      orderBy: { dispatchOrder: 'asc' },
    })

    await prisma.campaign.create({
      data: {
        title: campaign.title,
        messageTemplate: campaign.messageTemplate,
        scheduledAt: nextDate,
        isRecurring: true,
        recurDays: campaign.recurDays,
        clientId: campaign.clientId,
        contacts: {
          create: contacts.map((c, i) => ({
            name: c.name,
            phone: c.phone,
            dispatchOrder: i + 1,
          })),
        },
      },
    })

    console.log(`[cron/campaigns] 🔄 Recorrência criada: "${campaign.title}" para ${nextDate.toLocaleDateString('pt-BR')}`)
  }
}

function buildCampaignMessage(
  template: string,
  name: string,
  scheduledAt: Date,
  title: string
): string {
  const firstName = name.split(' ')[0]

  const data = scheduledAt.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })

  const horario = scheduledAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })

  return template
    .replace(/\{nome\}/gi, firstName)
    .replace(/\{nomeCompleto\}/gi, name)
    .replace(/\{data\}/gi, data)
    .replace(/\{horario\}/gi, horario)
    .replace(/\{titulo\}/gi, title)
}
