import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { GenerationTask } from '@/entities/generation-task'
import { startEngine, MAX_CONCURRENT } from './queueEngine'
import type { QueueAction, QueueState } from './queueReducer'

function task(id: string, createdAt: number): GenerationTask {
  return {
    id,
    prompt: id,
    type: 'text',
    model: 'GPT',
    status: 'queued',
    progress: 0,
    createdAt,
    credits: 1,
  }
}

function applyStart(stateRef: { current: QueueState }, action: QueueAction) {
  if (action.type !== 'START_TASK') return
  stateRef.current = {
    ...stateRef.current,
    tasks: stateRef.current.tasks.map((t) =>
      t.id === action.id && t.status === 'queued'
        ? {
            ...t,
            status: 'running' as const,
            startedAt: Date.now(),
            _failAtProgress: action.failAtProgress,
          }
        : t,
    ),
  }
}

describe('queueEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it(`starts at most ${MAX_CONCURRENT} tasks from the queue`, () => {
    const actions: QueueAction[] = []
    const state: QueueState = {
      tasks: [task('a', 1), task('b', 2), task('c', 3)],
      initStatus: 'ready',
      undoSnapshot: null,
    }
    const stateRef = { current: state }
    const dispatch = (action: QueueAction) => {
      actions.push(action)
      applyStart(stateRef, action)
    }

    const engine = startEngine(dispatch, stateRef)
    vi.advanceTimersByTime(300)

    const started = actions.filter((a) => a.type === 'START_TASK')
    expect(started).toHaveLength(MAX_CONCURRENT)
    expect(started.map((a) => (a as { id: string }).id)).toEqual(['a', 'b'])

    engine.cleanup()
  })

  it('does not dispatch duplicate START_TASK while task is still queued in stateRef', () => {
    const actions: QueueAction[] = []
    const state: QueueState = {
      tasks: [task('a', 1)],
      initStatus: 'ready',
      undoSnapshot: null,
    }
    const stateRef = { current: state }
    const dispatch = (action: QueueAction) => {
      actions.push(action)
      // Simulate slow React update — stateRef stays queued across ticks.
    }

    const engine = startEngine(dispatch, stateRef)
    vi.advanceTimersByTime(1000)

    const started = actions.filter((a) => a.type === 'START_TASK')
    expect(started).toHaveLength(1)

    engine.cleanup()
  })
})
