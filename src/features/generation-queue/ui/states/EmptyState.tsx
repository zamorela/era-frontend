import { ListVideo } from 'lucide-react'

interface EmptyStateProps {
  hasFilters: boolean
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-tag)] flex items-center justify-center">
        <ListVideo size={28} className="text-[var(--text-tertiary)]" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-base font-semibold text-foreground">Ничего не найдено</h3>
          <p className="text-sm text-[var(--text-tertiary)] max-w-xs">
            Попробуйте изменить фильтры или поисковый запрос
          </p>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-foreground">Очередь пуста</h3>
          <p className="text-sm text-[var(--text-tertiary)] max-w-xs">
            Запустите генерацию — задачи появятся здесь
          </p>
        </>
      )}
    </div>
  )
}
