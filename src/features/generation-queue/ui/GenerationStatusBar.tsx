import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, ChevronRight, ChevronUp, Image, Mic, Play, Type } from 'lucide-react'
import { useNavigate } from '@/shared/routing'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { cn } from '@/shared/lib/utils'
import type { GenerationTask, GenType } from '@/entities/generation-task'
import { useQueue } from '../model/useQueue'
import { ProgressBar } from './ProgressBar'

function formatActiveCount(count: number): string {
  if (count === 1) return '1 активна'
  return `${count} активны`
}

function formatGenerationCount(count: number): string {
  if (count === 1) return '1 генерация'
  if (count >= 2 && count <= 4) return `${count} генерации`
  return `${count} генераций`
}

function GenerationStatusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path
        d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8s2.91 6.5 6.5 6.5c.97 0 1.89-.21 2.72-.59A5.5 5.5 0 0 1 8 2.5a5.5 5.5 0 0 1 5.72 5.41c.38-.83.59-1.75.59-2.72 0-3.59-2.91-6.5-6.5-6.5Z"
        fill="#E85420"
      />
      <circle cx="11.5" cy="4.5" r="1.5" fill="#E85420" opacity="0.85" />
    </svg>
  )
}

function TaskMiniIcon({ type }: { type: GenType }) {
  const iconClass = 'h-3.5 w-3.5 text-[#E85420] shrink-0'
  switch (type) {
    case 'image':
      return <Image className={iconClass} strokeWidth={2} />
    case 'video':
      return <Play className={iconClass} strokeWidth={2} />
    case 'audio':
      return <Mic className={iconClass} strokeWidth={2} />
    default:
      return <Type className={iconClass} strokeWidth={2} />
  }
}

/** Docked above chat input panel — mount inside a `relative` container on /text only */
export function GenerationStatusBar() {
  const { activeCount, avgProgress, topActive } = useQueue()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const reduceMotion = useReducedMotion()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const goToQueue = () => navigate('/queue')

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 10, scale: 0.98 },
        transition: { type: 'spring' as const, stiffness: 420, damping: 32 },
      }

  return (
    <AnimatePresence>
      {activeCount > 0 && (
        <motion.div
          key="status-bar"
          {...motionProps}
          className={cn(
            'absolute bottom-full z-50 pointer-events-auto',
            'left-0 right-0 mb-2',
            'sm:left-auto sm:right-0 sm:w-[300px] sm:mb-3',
          )}
        >
          {isMobile ? (
            <MobileCompactBar
              activeCount={activeCount}
              avgProgress={avgProgress}
              onNavigate={goToQueue}
            />
          ) : isCollapsed ? (
            <CollapsedPill
              activeCount={activeCount}
              avgProgress={avgProgress}
              onExpand={() => setIsCollapsed(false)}
            />
          ) : activeCount === 1 ? (
            <SingleTaskBar
              task={topActive[0]}
              onCollapse={() => setIsCollapsed(true)}
              onNavigate={goToQueue}
            />
          ) : (
            <MultiTaskBar
              activeCount={activeCount}
              avgProgress={avgProgress}
              tasks={topActive}
              onCollapse={() => setIsCollapsed(true)}
              onNavigate={goToQueue}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Mobile chat: full-width compact bar with avg progress (Figma Chat + Status / Mobile 390) */
interface MobileCompactBarProps {
  activeCount: number
  avgProgress: number
  onNavigate: () => void
}

function MobileCompactBar({ activeCount, avgProgress, onNavigate }: MobileCompactBarProps) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        'w-full rounded-[14px] overflow-hidden text-left',
        'bg-[var(--bg-popup)] border border-[rgba(232,84,32,0.35)]',
        'shadow-[0_4px_24px_rgba(0,0,0,0.3)]',
        'active:border-[rgba(232,84,32,0.55)] transition-colors duration-150',
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <GenerationStatusIcon className="h-4 w-4" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground leading-none">
            {activeCount === 1 ? 'Генерация идёт' : 'Генерации идут'}
          </p>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
            {formatActiveCount(activeCount)} · {avgProgress}%
          </p>
        </div>
        <ChevronRight size={16} className="text-[#E85420] shrink-0" />
      </div>
      <div className="h-[3px] bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full bg-[#E85420] motion-safe:transition-[width] motion-safe:duration-300"
          style={{ width: `${Math.max(0, Math.min(100, avgProgress))}%` }}
        />
      </div>
    </button>
  )
}

interface CollapsedPillProps {
  activeCount: number
  avgProgress: number
  onExpand: () => void
}

function CollapsedPill({ activeCount, avgProgress, onExpand }: CollapsedPillProps) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        'flex items-center gap-2.5 px-4 py-2.5 rounded-full w-full sm:w-auto sm:ml-auto',
        'bg-[var(--bg-popup)] border border-[rgba(232,84,32,0.45)]',
        'shadow-[0_0_24px_rgba(232,84,32,0.18)]',
        'hover:border-[rgba(232,84,32,0.65)] transition-colors duration-150',
      )}
    >
      <GenerationStatusIcon className="h-4 w-4" />
      <span className="text-[13px] font-medium text-foreground whitespace-nowrap">
        {formatGenerationCount(activeCount)} · {avgProgress}%
      </span>
      <ChevronUp size={14} className="text-[var(--text-tertiary)] ml-auto shrink-0" />
    </button>
  )
}

interface SingleTaskBarProps {
  task: GenerationTask | undefined
  onCollapse: () => void
  onNavigate: () => void
}

function SingleTaskBar({ task, onCollapse, onNavigate }: SingleTaskBarProps) {
  if (!task) return null

  return (
    <div
      className={cn(
        'rounded-[16px] overflow-hidden cursor-pointer',
        'bg-[var(--bg-popup)] border border-[rgba(232,84,32,0.28)]',
        'shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_0_1px_rgba(232,84,32,0.06)]',
        'hover:border-[rgba(232,84,32,0.45)] transition-colors duration-150',
      )}
      onClick={onNavigate}
    >
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-primary)]">
        <GenerationStatusIcon className="h-4 w-4" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground leading-none">
            {task.status === 'running' ? 'Генерация идёт' : 'В очереди'}
          </p>
        </div>
        <button
          type="button"
          className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-foreground hover:bg-[var(--bg-tag)] transition-colors shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onCollapse()
          }}
          aria-label="Свернуть"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <TaskMiniIcon type={task.type} />
          <p className="flex-1 text-[13px] text-foreground truncate min-w-0">{task.prompt}</p>
          {task.status === 'running' ? (
            <span className="text-[12px] font-mono text-[#E85420] tabular-nums shrink-0">
              {task.progress}%
            </span>
          ) : (
            <span className="text-[12px] text-[var(--text-tertiary)] shrink-0">в очереди</span>
          )}
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono bg-[var(--bg-pill)] border border-[var(--border-secondary)] text-[var(--text-secondary)] mb-2.5">
          {task.model}
        </span>
        <ProgressBar progress={task.status === 'running' ? task.progress : 0} />
      </div>
    </div>
  )
}

interface MultiTaskBarProps {
  activeCount: number
  avgProgress: number
  tasks: GenerationTask[]
  onCollapse: () => void
  onNavigate: () => void
}

function MultiTaskBar({ activeCount, avgProgress, tasks, onCollapse, onNavigate }: MultiTaskBarProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] overflow-hidden',
        'bg-[var(--bg-popup)] border border-[rgba(232,84,32,0.28)]',
        'shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_0_1px_rgba(232,84,32,0.06)]',
      )}
    >
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-primary)]">
        <GenerationStatusIcon className="h-4 w-4" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground leading-none">Генерации идут</p>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
            {formatActiveCount(activeCount)} · {avgProgress}%
          </p>
        </div>
        <button
          type="button"
          className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:text-foreground hover:bg-[var(--bg-tag)] transition-colors shrink-0"
          onClick={onCollapse}
          aria-label="Свернуть"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="flex flex-col">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            className="px-4 py-3 text-left hover:bg-[var(--bg-card-hover)] transition-colors border-b border-[var(--border-primary)] last:border-b-0"
            onClick={onNavigate}
          >
            <div className="flex items-start gap-2.5">
              <TaskMiniIcon type={task.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[13px] text-foreground truncate">{task.prompt}</span>
                  {task.status === 'running' ? (
                    <span className="text-[12px] font-mono text-[#E85420] tabular-nums shrink-0">
                      {task.progress}%
                    </span>
                  ) : (
                    <span className="text-[12px] text-[var(--text-tertiary)] shrink-0">в очереди</span>
                  )}
                </div>
                <ProgressBar progress={task.status === 'running' ? task.progress : 0} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="w-full px-4 py-3 text-[13px] font-medium text-[#E85420] hover:bg-[rgba(232,84,32,0.06)] transition-colors border-t border-[var(--border-primary)]"
        onClick={onNavigate}
      >
        Открыть очередь →
      </button>
    </div>
  )
}
