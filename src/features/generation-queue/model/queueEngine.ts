import type { MutableRefObject } from 'react'
import type { GenerationTask, GenType } from '@/entities/generation-task'
import type { QueueAction, QueueState } from './queueReducer'

const MAX_CONCURRENT = 2

const FAIL_ERRORS = [
  'Недостаточно кредитов',
  'Превышено время ожидания',
  'Модель временно недоступна',
]

interface TickConfig {
  intervalMs: number
  minStep: number
  maxStep: number
}

const TICK_CONFIG: Record<GenType, TickConfig> = {
  text:  { intervalMs: 400, minStep: 5, maxStep: 9 },
  image: { intervalMs: 500, minStep: 4, maxStep: 7 },
  video: { intervalMs: 700, minStep: 1, maxStep: 3 },
  audio: { intervalMs: 600, minStep: 2, maxStep: 4 },
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomError(): string {
  return FAIL_ERRORS[Math.floor(Math.random() * FAIL_ERRORS.length)]
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
  let stopped = false

  function startTaskProgress(task: GenerationTask) {
    if (taskTimers.has(task.id)) return

    const config = TICK_CONFIG[task.type]

    const timer = setInterval(() => {
      if (stopped) return

      const currentState = stateRef.current
      const currentTask = currentState.tasks.find((t) => t.id === task.id)

      if (!currentTask || currentTask.status !== 'running') {
        clearInterval(timer)
        taskTimers.delete(task.id)
        return
      }

      if (
        currentTask._failAtProgress !== undefined &&
        currentTask.progress >= currentTask._failAtProgress
      ) {
        clearInterval(timer)
        taskTimers.delete(task.id)
        dispatch({ type: 'FAIL_TASK', id: task.id, error: randomError() })
        return
      }

      const delta = randomBetween(config.minStep, config.maxStep)
      const newProgress = Math.min(100, currentTask.progress + delta)

      if (newProgress >= 100) {
        clearInterval(timer)
        taskTimers.delete(task.id)
        dispatch({ type: 'COMPLETE_TASK', id: task.id })
        return
      }

      dispatch({ type: 'TICK_PROGRESS', id: task.id, delta })
    }, config.intervalMs)

    taskTimers.set(task.id, timer)
  }

  const mainLoop = setInterval(() => {
    if (stopped) return

    const state = stateRef.current
    if (state.initStatus !== 'ready') return

    const runningTasks = state.tasks.filter((t) => t.status === 'running')
    const queuedTasks = state.tasks
      .filter((t) => t.status === 'queued')
      .sort((a, b) => a.createdAt - b.createdAt)

    runningTasks.forEach((task) => {
      if (!taskTimers.has(task.id)) {
        startTaskProgress(task)
      }
    })

    const slotsAvailable = MAX_CONCURRENT - runningTasks.length
    for (let i = 0; i < slotsAvailable && i < queuedTasks.length; i++) {
      const task = queuedTasks[i]
      const failAtProgress =
        Math.random() < 0.15
          ? randomBetween(20, 80)
          : undefined

      dispatch({ type: 'START_TASK', id: task.id, failAtProgress })
    }
  }, 250)

  function cancelTask(id: string) {
    const timer = taskTimers.get(id)
    if (timer !== undefined) {
      clearInterval(timer)
      taskTimers.delete(id)
    }
  }

  function cleanup() {
    stopped = true
    clearInterval(mainLoop)
    taskTimers.forEach((timer) => clearInterval(timer))
    taskTimers.clear()
  }

  return { cancelTask, cleanup }
}
