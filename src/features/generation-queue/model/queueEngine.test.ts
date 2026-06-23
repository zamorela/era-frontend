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
      if (action.type === 'START_TASK') {
        stateRef.current = {
          ...stateRef.current,
          tasks: stateRef.current.tasks.map((t) =>
            t.id === action.id ? { ...t, status: 'running' as const, startedAt: Date.now() } : t,
          ),
        }
      }
    }

    const engine = startEngine(dispatch, stateRef)
    vi.advanceTimersByTime(300)

    const started = actions.filter((a) => a.type === 'START_TASK')
    expect(started).toHaveLength(MAX_CONCURRENT)
    expect(started.map((a) => (a as { id: string }).id)).toEqual(['a', 'b'])

    engine.cleanup()
  })
})
