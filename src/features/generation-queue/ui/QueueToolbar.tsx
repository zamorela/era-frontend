import { useEffect, useRef, useState } from 'react'
import { ArrowDownUp, ChevronDown, Search } from 'lucide-react'
import { Chip } from '@/shared/ui/era'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'
import type { StatusFilter, SortOrder, TypeFilter } from '@/features/generation-queue'

interface QueueToolbarProps {
  filter: StatusFilter
  onFilterChange: (f: StatusFilter) => void
  sort: SortOrder
  onSortChange: (s: SortOrder) => void
  search: string
  onSearchChange: (s: string) => void
  typeFilter: TypeFilter
  onTypeFilterChange: (t: TypeFilter) => void
}

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'queued', label: 'В очереди' },
  { value: 'running', label: 'Идёт' },
  { value: 'done', label: 'Готово' },
  { value: 'failed', label: 'Ошибка' },
]

const TYPE_CHIPS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Все типы' },
  { value: 'text', label: 'Текст' },
  { value: 'image', label: 'Изображение' },
  { value: 'video', label: 'Видео' },
  { value: 'audio', label: 'Аудио' },
]

const SORT_LABELS: Record<SortOrder, string> = {
  newest: 'Сначала новые',
  oldest: 'Сначала старые',
  status: 'По статусу',
  progress: 'По прогрессу',
}

export function QueueToolbar({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
}: QueueToolbarProps) {
  const [inputValue, setInputValue] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearchChange(inputValue)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [inputValue, onSearchChange])

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: status chips + sort + search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-nowrap max-sm:flex-1">
          {STATUS_CHIPS.map((chip) => (
            <Chip
              key={chip.value}
              active={filter === chip.value}
              onClick={() => onFilterChange(chip.value)}
              className="shrink-0"
            >
              {chip.label}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
            />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Поиск..."
              className="pl-8 h-7 text-sm w-44 max-sm:w-32 bg-[var(--bg-card)] border-[var(--border-primary)] rounded-full"
            />
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-[var(--text-secondary)] border-[var(--border-primary)]"
              >
                <ArrowDownUp size={12} />
                <span className="max-sm:hidden">{SORT_LABELS[sort]}</span>
                <ChevronDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {(Object.keys(SORT_LABELS) as SortOrder[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  className={cn(sort === key && 'text-[#E85420]')}
                  onClick={() => onSortChange(key)}
                >
                  {SORT_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2: type filter chips (bonus) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-nowrap">
        {TYPE_CHIPS.map((chip) => (
          <Chip
            key={chip.value}
            active={typeFilter === chip.value}
            onClick={() => onTypeFilterChange(chip.value)}
            className="shrink-0 text-[11px] h-6 px-2.5"
          >
            {chip.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
