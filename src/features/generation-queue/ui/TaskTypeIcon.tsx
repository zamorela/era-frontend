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

const bgMap: Record<GenType, string> = {
  text: 'bg-[var(--bg-tag)] text-[var(--text-secondary)]',
  image: 'bg-[var(--bg-tag)] text-[var(--text-secondary)]',
  video: 'bg-[rgba(232,84,32,0.15)] text-[#E85420]',
  audio: 'bg-[rgba(232,84,32,0.15)] text-[#E85420]',
}

export function TaskTypeIcon({ type, size = 'md' }: TaskTypeIconProps) {
  const Icon = iconMap[type]
  const isSmall = size === 'sm'
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full shrink-0',
        bgMap[type],
        isSmall ? 'w-8 h-8' : 'w-10 h-10',
      )}
    >
      <Icon size={isSmall ? 14 : 16} />
    </div>
  )
}
