import { describe, expect, it } from 'vitest'
import { estimateRemainingMs } from './tickConfig'

describe('tickConfig', () => {
  it('estimateRemainingMs decreases as progress increases', () => {
    const atStart = estimateRemainingMs('text', 0)
    const halfway = estimateRemainingMs('text', 50)
    expect(halfway).toBeLessThan(atStart)
    expect(estimateRemainingMs('text', 100)).toBe(0)
  })
})
