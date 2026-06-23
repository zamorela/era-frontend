import { Skeleton } from '@/shared/ui/skeleton'

export function LoadingState() {
  return (
    <div className="flex flex-col gap-2.5 sm:gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4 sm:py-3.5 rounded-[14px] bg-[var(--bg-card)] border border-[var(--border-primary)]"
        >
          <div className="flex items-start gap-3 sm:contents">
            <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] shrink-0" />
            <div className="flex-1 space-y-2 sm:space-y-2">
              <Skeleton className="h-4 w-full max-w-[280px] rounded-md" />
              <Skeleton className="h-3 w-2/3 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-[3px] w-full rounded-full sm:hidden" />
          <div className="flex items-center justify-between sm:contents">
            <Skeleton className="h-6 w-20 rounded-full sm:h-8 sm:w-14 sm:rounded-md" />
            <div className="flex gap-1.5 sm:contents">
              <Skeleton className="h-8 w-8 rounded-[10px]" />
              <Skeleton className="h-8 w-8 rounded-[10px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
