import { prisma } from './db'

/**
 * Cria os 4 lembretes para um agendamento.
 * Só cria lembretes que ainda não passaram.
 */
export async function scheduleNotifications(appointmentId: string, scheduledAt: Date) {
  const now = new Date()

  const offsets: { type: string; minutes: number }[] = [
    { type: '24H',   minutes: 24 * 60 },
    { type: '3H',    minutes: 3 * 60 },
    { type: '1H',    minutes: 60 },
    { type: '15MIN', minutes: 15 },
  ]

  // Se o agendamento já passou, não cria nenhum lembrete
  if (scheduledAt <= now) return

  const toCreate = offsets.map(({ type, minutes }) => ({
    appointmentId,
    type,
    scheduledAt: new Date(scheduledAt.getTime() - minutes * 60 * 1000),
  }))

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
