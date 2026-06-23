import { cn } from '@/shared/lib/utils'

interface ProgressBarProps {
  progress: number
  className?: string
  showLabel?: boolean
}

export function ProgressBar({ progress, className, showLabel = false }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-[3px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#E85420] rounded-full motion-safe:transition-[width] motion-safe:duration-300"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-[#E85420] tabular-nums w-8 text-right shrink-0">
          {clamped}%
        </span>
      )}
    </div>
  )
}
