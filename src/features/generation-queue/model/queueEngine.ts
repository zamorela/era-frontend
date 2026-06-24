import type { MutableRefObject } from 'react'
import type { GenerationTask } from '@/entities/generation-task'
import { TICK_CONFIG } from '../lib/tickConfig'
import type { QueueAction, QueueState } from './queueReducer'

export const MAX_CONCURRENT = 2

const MAIN_LOOP_MS = 250

const FAIL_ERRORS = [
  'Недостаточно кредитов',
  'Превышено время ожидания',
  'Модель временно недоступна',
] as const

const FAIL_PROBABILITY = 0.15

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomError(): string {
  return FAIL_ERRORS[Math.floor(Math.random() * FAIL_ERRORS.length)]
}

function resolveFailAtProgress(): number | undefined {
  return Math.random() < FAIL_PROBABILITY ? randomBetween(20, 80) : undefined
}

export interface QueueEngine {
  cancelTask: (id: string) => void
  cleanup: () => void
}

export function startEngine(
  dispatch: (action: QueueAction) => void,
  stateRef: MutableRefObject<QueueState>,
): QueueEngine {
  const taskTimers = new Map<string, ReturnType<typeof setInterval>>()
  /** Prevents duplicate START_TASK while React state is catching up. */
  const pendingStarts = new Set<string>()
  let stopped = false

  function clearTaskTimer(id: string) {
    const timer = taskTimers.get(id)
    if (timer !== undefined) {
      clearInterval(timer)
      taskTimers.delete(id)
    }
  }

  function startTaskProgress(task: GenerationTask) {
    if (taskTimers.has(task.id)) return

    const config = TICK_CONFIG[task.type]

    const timer = setInterval(() => {
      if (stopped) return

      const currentTask = stateRef.current.tasks.find((t) => t.id === task.id)

      if (!currentTask || currentTask.status !== 'running') {
        clearTaskTimer(task.id)
        return
      }

      if (
        currentTask._failAtProgress !== undefined &&
        currentTask.progress >= currentTask._failAtProgress
      ) {
        clearTaskTimer(task.id)
        dispatch({ type: 'FAIL_TASK', id: task.id, error: randomError() })
        return
      }

      const delta = randomBetween(config.minStep, config.maxStep)
      const newProgress = Math.min(100, currentTask.progress + delta)

      if (newProgress >= 100) {
        clearTaskTimer(task.id)
        dispatch({ type: 'COMPLETE_TASK', id: task.id })
        return
      }

      dispatch({ type: 'TICK_PROGRESS', id: task.id, delta })
    }, config.intervalMs)

    taskTimers.set(task.id, timer)
  }

  function tryStartQueuedTask(task: GenerationTask) {
    if (pendingStarts.has(task.id)) return

    pendingStarts.add(task.id)
    dispatch({
      type: 'START_TASK',
      id: task.id,
      failAtProgress: resolveFailAtProgress(),
    })
  }

  const mainLoop = setInterval(() => {
    if (stopped) return

    const state = stateRef.current
    if (state.initStatus !== 'ready') return

    const runningTasks = state.tasks.filter((t) => t.status === 'running')
    runningTasks.forEach((task) => {
      if (!taskTimers.has(task.id)) startTaskProgress(task)
    })

    // Drop pending markers once the task leaves the queue or is removed.
    for (const id of pendingStarts) {
      const task = state.tasks.find((t) => t.id === id)
      if (!task || task.status !== 'queued') {
        pendingStarts.delete(id)
      }
    }

    const slotsAvailable = MAX_CONCURRENT - runningTasks.length
    if (slotsAvailable <= 0) return

    const queuedTasks = state.tasks
      .filter((t) => t.status === 'queued')
      .sort((a, b) => a.createdAt - b.createdAt)

    for (let i = 0; i < slotsAvailable && i < queuedTasks.length; i++) {
      tryStartQueuedTask(queuedTasks[i])
    }
  }, MAIN_LOOP_MS)

  function cancelTask(id: string) {
    clearTaskTimer(id)
    pendingStarts.delete(id)
  }

  function cleanup() {
    stopped = true
    clearInterval(mainLoop)
    taskTimers.forEach((timer) => clearInterval(timer))
    taskTimers.clear()
    pendingStarts.clear()
  }

  return { cancelTask, cleanup }
}
