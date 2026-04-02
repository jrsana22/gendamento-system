import axios from 'axios'

interface SendTextParams {
  evoUrl: string
  apiKey: string
  instanceName: string
  to: string   // DDI+DDD+número ex: 5511999999999
  text: string
}

export async function sendWhatsAppMessage({
  evoUrl,
  apiKey,
  instanceName,
  to,
  text,
}: SendTextParams): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const url = `${evoUrl.replace(/\/$/, '')}/message/sendText/${instanceName}`

    const { data } = await axios.post(
      url,
      { number: to, text, delay: 1000 },
      {
        headers: { apikey: apiKey, 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    )

    return { success: true, data }
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string }
    console.error('[Evolution] Erro:', error?.response?.data || error?.message)
    return {
      success: false,
      error: JSON.stringify(error?.response?.data || error?.message),
    }
  }
}

// ── Mensagens de lembrete ─────────────────────────────────────────────────────
//
// A pessoa JÁ confirmou presença pelo fluxo do WhatsApp/n8n.
// O tom é de quem espera e está preparando tudo — não de convite.
//
// Variáveis disponíveis: firstName, timeStr, dateStr, title

export function buildMessage(
  type: '24H' | '3H' | '1H' | '15MIN',
  customerName: string,
  scheduledAt: Date,
  appointmentTitle: string
): string {
  const firstName = customerName.split(' ')[0]

  const messages: Record<typeof type, string> = {
    // 24h antes — lembrete tranquilo, reforça que está tudo confirmado
    '24H': [
      `Oi, ${firstName}! 😊`,
      ``,
      `Passando pra te lembrar que amanhã é o nosso dia! 🗓️`,
      ``,
      `📌 *${appointmentTitle}*`,
      ``,
      `Estamos preparando tudo com cuidado pra você. Qualquer dúvida antes de chegar, é só falar. Até amanhã!`,
    ].join('\n'),

    // 3h antes — mais próximo, cria expectativa positiva
    '3H': [
      `Oi, ${firstName}! Tudo bem? 👋`,
      ``,
      `Daqui a pouco nos encontramos! Estamos te esperando com tudo pronto. 🙌`,
      ``,
      `📌 *${appointmentTitle}*`,
      ``,
      `Se precisar de algo antes de chegar, é só chamar aqui. Até logo!`,
    ].join('\n'),

    // 1h antes — direto, animado
    '1H': [
      `${firstName}, já tá chegando! ⏳`,
      ``,
      `📌 *${appointmentTitle}*`,
      ``,
      `A gente tá aqui, te esperando. Qualquer imprevisto de última hora me avisa, tá? Até já! 🤝`,
    ].join('\n'),

    // 15min antes — curto, informal, "já quase"
    '15MIN': [
      `Oi, ${firstName}! Estamos quase lá. ⏰`,
      ``,
      `📌 *${appointmentTitle}*`,
      ``,
      `Tudo certo aí? Qualquer coisa é só falar. Até já! 😊`,
    ].join('\n'),
  }

  return messages[type]
}
