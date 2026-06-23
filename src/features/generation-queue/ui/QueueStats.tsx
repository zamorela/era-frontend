import type { QueueStats } from '@/features/generation-queue'
import { cn } from '@/shared/lib/utils'

interface QueueStatsProps {
  stats: QueueStats
}

interface StatCard {
  label: string
  value: number
  dotClass: string
}

export function QueueStats({ stats }: QueueStatsProps) {
  const cards: StatCard[] = [
    { label: 'В очереди', value: stats.queued, dotClass: 'bg-[var(--text-tertiary)]' },
    { label: 'Идёт', value: stats.running, dotClass: 'bg-[#E85420]' },
    { label: 'Готово', value: stats.done, dotClass: 'bg-[#22c55e]' },
    { label: 'Ошибка', value: stats.failed, dotClass: 'bg-[#ef4444]' },
  ]

  return (
    <div className="grid grid-cols-4 max-sm:grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[var(--r-md)] p-4"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', card.dotClass)} />
            <span className="text-xs text-[var(--text-tertiary)] leading-none">{card.label}</span>
          </div>
          <span className="font-mono text-3xl font-bold text-foreground tabular-nums leading-none">
            {card.value}
          </span>
        </div>
      ))}
    </div>
  )
}
