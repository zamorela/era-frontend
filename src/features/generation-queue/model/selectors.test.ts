import { describe, expect, it } from 'vitest'
import type { GenerationTask } from '@/entities/generation-task'
import {
  findReorderNeighbor,
  selectFiltered,
  selectQueuedInOrder,
  selectTasksWithPositions,
} from './selectors'

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

describe('selectors', () => {
  it('selectTasksWithPositions assigns FIFO positions only to queued tasks', () => {
    const tasks = [
      task({ id: 'a', createdAt: 1000 }),
      task({ id: 'b', status: 'running', createdAt: 2000 }),
      task({ id: 'c', createdAt: 3000 }),
    ]

    const withPositions = selectTasksWithPositions(tasks)
    expect(withPositions.find((t) => t.id === 'a')?.queuePosition).toBe(1)
    expect(withPositions.find((t) => t.id === 'b')?.queuePosition).toBeUndefined()
    expect(withPositions.find((t) => t.id === 'c')?.queuePosition).toBe(2)
  })

  it('selectFiltered returns a new sorted array without mutating input', () => {
    const input = [
      task({ id: 'a', createdAt: 2000 }),
      task({ id: 'b', createdAt: 1000 }),
    ]
    const snapshot = input.map((t) => t.id)

    const filtered = selectFiltered(input, 'all', 'newest', '', 'all')
    expect(filtered[0].id).toBe('a')
    expect(input.map((t) => t.id)).toEqual(snapshot)
  })

  it('selectQueuedInOrder ignores non-queued tasks', () => {
    const queued = selectQueuedInOrder([
      task({ id: 'a', createdAt: 2000 }),
      task({ id: 'b', status: 'done', createdAt: 1000 }),
      task({ id: 'c', createdAt: 3000 }),
    ])

    expect(queued.map((t) => t.id)).toEqual(['a', 'c'])
  })

  it('findReorderNeighbor returns adjacent queued task', () => {
    const queued = selectQueuedInOrder([
      task({ id: 'a', createdAt: 1000 }),
      task({ id: 'b', createdAt: 2000 }),
      task({ id: 'c', createdAt: 3000 }),
    ])

    expect(findReorderNeighbor(queued, 'b', 'up')?.id).toBe('a')
    expect(findReorderNeighbor(queued, 'b', 'down')?.id).toBe('c')
    expect(findReorderNeighbor(queued, 'a', 'up')).toBeUndefined()
  })
})
