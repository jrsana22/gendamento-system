import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

export function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  DONE: 'Concluído',
  CANCELLED: 'Cancelado',
}

export const NOTIF_LABELS: Record<string, string> = {
  '24H':   '24h antes',
  '3H':    '3h antes',
  '1H':    '1h antes',
  '15MIN': '15min antes',
}

export const NOTIF_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  SENT:    'Enviado',
  FAILED:  'Falhou',
}
