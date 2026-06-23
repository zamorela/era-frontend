import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'

interface ErrorStateProps {
  onRetry: () => void
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
        <AlertTriangle size={28} className="text-[#ef4444]" />
      </div>
      <h3 className="text-base font-semibold text-foreground">Не удалось загрузить очередь</h3>
      <p className="text-sm text-[var(--text-tertiary)] max-w-xs">
        Произошла ошибка при инициализации. Попробуйте ещё раз.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw size={14} />
        Повторить
      </Button>
    </div>
  )
}
