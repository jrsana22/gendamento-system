import { cn } from '@/lib/utils'

type BadgeVariant = 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  blue:   'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300',
  green:  'bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300',
  red:    'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300',
  yellow: 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300',
  gray:   'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300',
  purple: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300',
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
