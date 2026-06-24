import { useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import type { GenerationTask } from '@/entities/generation-task'
import { cn } from '@/shared/lib/utils'
import { findReorderNeighbor } from '../model/selectors'
import { TaskRow } from './TaskRow'
import { TaskCard } from './TaskCard'

const VIRTUAL_THRESHOLD = 20
const ROW_HEIGHT_DESKTOP = 92
const ROW_HEIGHT_MOBILE = 160

interface TaskListProps {
  tasks: GenerationTask[]
  /** Full FIFO queue — used for reorder, unaffected by filters/sort. */
  queuedTasks: GenerationTask[]
  isMobile: boolean
  onCancel: (id: string) => void
  onRetry: (id: string) => void
  onRemove: (id: string) => void
  onReorderQueued: (activeId: string, overId: string) => void
}

export function TaskList({
  tasks,
  queuedTasks,
  isMobile,
  onCancel,
  onRetry,
  onRemove,
  onReorderQueued,
}: TaskListProps) {
  const reduceMotion = useReducedMotion()
  const parentRef = useRef<HTMLDivElement>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const useVirtual = tasks.length >= VIRTUAL_THRESHOLD
  const rowHeight = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DESKTOP

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 6,
  })

  const motionProps = reduceMotion
    ? {}
    : {
        layout: true as const,
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, x: -12, height: 0, marginBottom: 0 },
        transition: { duration: 0.2, ease: 'easeOut' as const },
      }

  function handleDragStart(e: React.DragEvent, task: GenerationTask) {
    if (task.status !== 'queued') {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('text/task-id', task.id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(task.id)
  }

  function handleDragOver(e: React.DragEvent, task: GenerationTask) {
    if (task.status !== 'queued' || !draggingId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(task.id)
  }

  function handleDrop(e: React.DragEvent, task: GenerationTask) {
    e.preventDefault()
    const fromId = e.dataTransfer.getData('text/task-id')
    if (fromId && fromId !== task.id && task.status === 'queued') {
      onReorderQueued(fromId, task.id)
    }
    setDragOverId(null)
    setDraggingId(null)
  }

  function handleKeyDown(e: React.KeyboardEvent, task: GenerationTask) {
    if (task.status !== 'queued' || !e.altKey) return
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return

    e.preventDefault()
    const direction = e.key === 'ArrowUp' ? 'up' : 'down'
    const target = findReorderNeighbor(queuedTasks, task.id, direction)
    if (target) onReorderQueued(task.id, target.id)
  }

  function renderTask(task: GenerationTask) {
    const isQueued = task.status === 'queued'
    const TaskComponent = isMobile ? TaskCard : TaskRow

    return (
      <div
        className={cn(
          'relative group',
          isQueued && 'cursor-grab active:cursor-grabbing',
          dragOverId === task.id && isQueued && 'ring-1 ring-[#E85420] rounded-[14px]',
          draggingId === task.id && 'opacity-50',
        )}
        draggable={isQueued}
        tabIndex={isQueued ? 0 : undefined}
        aria-label={
          isQueued
            ? `Задача в очереди, позиция ${task.queuePosition ?? '—'}. Alt+стрелки — изменить порядок`
            : undefined
        }
        onKeyDown={(e) => handleKeyDown(e, task)}
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={() => {
          setDragOverId(null)
          setDraggingId(null)
        }}
        onDragOver={(e) => handleDragOver(e, task)}
        onDragLeave={() => {
          if (dragOverId === task.id) setDragOverId(null)
        }}
        onDrop={(e) => handleDrop(e, task)}
        aria-grabbed={draggingId === task.id ? true : undefined}
      >
        {isQueued && !isMobile && (
          <div
            className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none"
            aria-hidden
          >
            <GripVertical size={14} className="text-[var(--text-tertiary)]" />
          </div>
        )}
        <TaskComponent
          task={task}
          onCancel={onCancel}
          onRetry={onRetry}
          onRemove={onRemove}
        />
      </div>
    )
  }

  if (!useVirtual) {
    return (
      <AnimatePresence mode="popLayout">
        <div
          className="flex flex-col gap-2.5 sm:gap-2"
          role="list"
          aria-label="Список задач генерации"
        >
          {tasks.map((task) => (
            <motion.div key={task.id} role="listitem" {...motionProps}>
              {renderTask(task)}
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    )
  }

  return (
    <div
      ref={parentRef}
      className="max-h-[calc(100vh-380px)] overflow-auto rounded-[14px] border border-[var(--border-primary)]"
      role="list"
      aria-label="Список задач генерации"
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const task = tasks[virtualRow.index]
          return (
            <div
              key={task.id}
              role="listitem"
              className="absolute left-0 top-0 w-full px-1 pb-2"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderTask(task)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
