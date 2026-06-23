import { describe, expect, it } from 'vitest'
import type { GenerationTask } from '@/entities/generation-task'
import { queueReducer, initialQueueState } from './queueReducer'

function task(overrides: Partial<GenerationTask> = {}): GenerationTask {
  return {
    id: 't1',
    prompt: 'Test prompt',
    type: 'text',
    model: 'GPT-4o',
    status: 'queued',
    progress: 0,
    createdAt: 1000,
    credits: 5,
    ...overrides,
  }
}

describe('queueReducer', () => {
  it('START_TASK moves queued task to running', () => {
    const state = {
      ...initialQueueState,
      initStatus: 'ready' as const,
      tasks: [task({ id: 'a' })],
    }
    const next = queueReducer(state, { type: 'START_TASK', id: 'a', failAtProgress: 50 })
    expect(next.tasks[0].status).toBe('running')
    expect(next.tasks[0]._failAtProgress).toBe(50)
    expect(next.tasks[0].startedAt).toBeDefined()
  })

  it('CANCEL_TASK cancels running and queued tasks', () => {
    const state = {
      ...initialQueueState,
      initStatus: 'ready' as const,
      tasks: [
        task({ id: 'run', status: 'running', progress: 40 }),
        task({ id: 'q', status: 'queued' }),
      ],
    }
    const next = queueReducer(state, { type: 'CANCEL_TASK', id: 'run' })
    expect(next.tasks.find((t) => t.id === 'run')?.status).toBe('canceled')
    const next2 = queueReducer(next, { type: 'CANCEL_TASK', id: 'q' })
    expect(next2.tasks.find((t) => t.id === 'q')?.status).toBe('canceled')
  })

  it('CLEAR_DONE removes done tasks and RESTORE_TASKS brings them back', () => {
    const done = task({ id: 'd', status: 'done', progress: 100 })
    const state = {
      ...initialQueueState,
      initStatus: 'ready' as const,
      tasks: [done, task({ id: 'q' })],
    }
    const cleared = queueReducer(state, { type: 'CLEAR_DONE' })
    expect(cleared.tasks).toHaveLength(1)
    expect(cleared.tasks[0].id).toBe('q')

    const restored = queueReducer(cleared, { type: 'RESTORE_TASKS', tasks: [done] })
    expect(restored.tasks).toHaveLength(2)
    expect(restored.tasks.find((t) => t.id === 'd')?.status).toBe('done')
  })

  it('REORDER_QUEUED changes FIFO order by createdAt', () => {
    const state = {
      ...initialQueueState,
      initStatus: 'ready' as const,
      tasks: [
        task({ id: 'a', createdAt: 1000 }),
        task({ id: 'b', createdAt: 2000 }),
        task({ id: 'c', createdAt: 3000 }),
      ],
    }
    const next = queueReducer(state, { type: 'REORDER_QUEUED', activeId: 'c', overId: 'a' })
    const queued = next.tasks
      .filter((t) => t.status === 'queued')
      .sort((a, b) => a.createdAt - b.createdAt)
    expect(queued.map((t) => t.id)).toEqual(['c', 'a', 'b'])
  })

  it('COMPLETE_TASK sets progress to 100 and status done', () => {
    const state = {
      ...initialQueueState,
      initStatus: 'ready' as const,
      tasks: [task({ id: 'a', status: 'running', progress: 95 })],
    }
    const next = queueReducer(state, { type: 'COMPLETE_TASK', id: 'a' })
    expect(next.tasks[0].status).toBe('done')
    expect(next.tasks[0].progress).toBe(100)
    expect(next.tasks[0].completedAt).toBeDefined()
  })
})
