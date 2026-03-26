import { prisma } from './db'

/**
 * Cria os 4 lembretes para um agendamento.
 * Sempre cria os 4 — os que já passaram ficam com status FAILED
 * para o usuário ver o histórico completo (ex: 0/4 em vez de 0/0).
 */
export async function scheduleNotifications(appointmentId: string, scheduledAt: Date) {
  const now = new Date()

  const offsets: { type: string; minutes: number }[] = [
    { type: '24H',   minutes: 24 * 60 },
    { type: '3H',    minutes: 3 * 60 },
    { type: '1H',    minutes: 60 },
    { type: '15MIN', minutes: 15 },
  ]

  const toCreate = offsets.map(({ type, minutes }) => {
    const notifAt = new Date(scheduledAt.getTime() - minutes * 60 * 1000)
    return {
      appointmentId,
      type,
      scheduledAt: notifAt,
      status: notifAt > now ? 'PENDING' : 'FAILED',
    }
  })

  await prisma.notification.createMany({ data: toCreate })
}

/**
 * Remove lembretes pendentes de um agendamento (usado ao cancelar/editar).
 */
export async function cancelPendingNotifications(appointmentId: string) {
  await prisma.notification.deleteMany({
    where: { appointmentId, status: 'PENDING' },
  })
}
