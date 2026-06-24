import { describe, expect, it, beforeEach, vi } from 'vitest'
import type { GenerationTask } from '@/entities/generation-task'
import {
  QUEUE_STORAGE_KEY,
  loadQueueFromStorage,
  normalizeTasksForRestore,
  saveQueueToStorage,
} from './queueStorage'

const validTask: GenerationTask = {
  id: 'task-1',
  prompt: 'Hello',
  type: 'text',
  model: 'GPT',
  status: 'running',
  progress: 42,
  createdAt: 1_000,
  credits: 3,
  _failAtProgress: 70,
}

describe('queueStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null
      },
      setItem(key: string, value: string) {
        this.store[key] = value
      },
      removeItem(key: string) {
        delete this.store[key]
      },
    })
  })

  it('normalizeTasksForRestore resets running tasks to queued and strips engine fields', () => {
    const restored = normalizeTasksForRestore([validTask])[0]
    expect(restored.status).toBe('queued')
    expect(restored._failAtProgress).toBeUndefined()
    expect(restored.progress).toBe(42)
  })

  it('save/load roundtrip validates schema and strips engine fields', () => {
    saveQueueToStorage([validTask])
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    expect(raw).not.toContain('_failAtProgress')

    const loaded = loadQueueFromStorage()
    expect(loaded).toHaveLength(1)
    expect(loaded?.[0].status).toBe('queued')
  })

  it('loadQueueFromStorage clears corrupted payload', () => {
    localStorage.setItem(QUEUE_STORAGE_KEY, '{"not":"array"}')
    expect(loadQueueFromStorage()).toBeNull()
    expect(localStorage.getItem(QUEUE_STORAGE_KEY)).toBeNull()
  })
})
