import { Image, MessageSquare, Music, Play } from 'lucide-react'
import type { GenType } from '@/entities/generation-task'
import { cn } from '@/shared/lib/utils'

interface TaskTypeIconProps {
  type: GenType
  size?: 'sm' | 'md'
}

const iconMap: Record<GenType, React.ComponentType<{ size: number; className?: string }>> = {
  text: MessageSquare,
  image: Image,
  video: Play,
  audio: Music,
}

export function TaskTypeIcon({ type, size = 'md' }: TaskTypeIconProps) {
  const Icon = iconMap[type]
  const isSmall = size === 'sm'

  return (
    <div
      className={cn(
        'flex items-center justify-center shrink-0 rounded-[12px]',
        'bg-[var(--bg-secondary)] border border-[var(--border-primary)]',
        'text-[var(--text-secondary)]',
        isSmall ? 'w-9 h-9' : 'w-10 h-10',
      )}
    >
      <Icon size={isSmall ? 15 : 16} />
    </div>
  )
}
