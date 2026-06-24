import { z } from 'zod'

export const genTypeSchema = z.enum(['text', 'image', 'video', 'audio'])

export const taskStatusSchema = z.enum(['queued', 'running', 'done', 'failed', 'canceled'])

export const generationTaskSchema = z.object({
  id: z.string().min(1),
  prompt: z.string(),
  type: genTypeSchema,
  model: z.string(),
  status: taskStatusSchema,
  progress: z.number().min(0).max(100),
  createdAt: z.number().finite(),
  startedAt: z.number().finite().optional(),
  completedAt: z.number().finite().optional(),
  error: z.string().optional(),
  credits: z.number().nonnegative(),
  queuePosition: z.number().int().positive().optional(),
  _failAtProgress: z.number().min(0).max(100).optional(),
})

export const generationTaskListSchema = z.array(generationTaskSchema)
