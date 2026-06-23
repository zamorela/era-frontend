import type { QueueStats } from '../model/selectors'
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[14px] px-4 py-3 sm:px-5 sm:py-4"
        >
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', card.dotClass)} />
            <span className="text-[12px] sm:text-[13px] text-[var(--text-tertiary)] leading-none">{card.label}</span>
          </div>
          <span className="font-mono text-[28px] sm:text-[40px] font-bold text-foreground tabular-nums leading-none tracking-tight">
            {card.value}
          </span>
        </div>
      ))}
    </div>
  )
}
