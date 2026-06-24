import { useCallback } from 'react'
import { toast } from 'sonner'
import type { GenType } from '@/entities/generation-task'
import { createTaskId } from '../lib/taskId'
import { useQueueContext } from './QueueProvider'

export interface AddTaskParams {
  prompt: string
  type: GenType
  model: string
  credits: number
}

const TEST_PROMPTS: { prompt: string; type: GenType; model: string; credits: number }[] = [
  { prompt: 'Неоновый город будущего в дождь, кинематографичный стиль', type: 'image', model: 'Midjourney v6', credits: 80 },
  { prompt: 'Написать рекламный слоган для кофейни в стиле минимализм', type: 'text', model: 'GPT-4o', credits: 4 },
  { prompt: 'Таймлапс заката над горами, 5 секунд', type: 'video', model: 'Kling 3.0', credits: 150 },
  { prompt: 'Озвучка персонажа: молодой учёный, нейтральный тон', type: 'audio', model: 'ElevenLabs', credits: 20 },
  { prompt: 'Логотип для приложения по медитации, flat-стиль', type: 'image', model: 'Flux', credits: 60 },
  { prompt: 'Краткое эссе о влиянии ИИ на творчество', type: 'text', model: 'Claude 3.5', credits: 6 },
]

let testCounter = 0

export function useQueue() {
  const ctx = useQueueContext()
  const { state, dispatch, retryInit } = ctx

  const cancel = useCallback(
    (id: string) => dispatch({ type: 'CANCEL_TASK', id }),
    [dispatch],
  )

  const retry = useCallback(
    (id: string) => dispatch({ type: 'RETRY_TASK', id }),
    [dispatch],
  )

  const remove = useCallback(
    (id: string) => {
      const task = state.tasks.find((t) => t.id === id)
      if (!task) return

      dispatch({ type: 'DELETE_TASK', id })
      toast('Задача удалена', {
        duration: 5000,
        action: {
          label: 'Отменить',
          onClick: () => dispatch({ type: 'RESTORE_TASKS', tasks: [task] }),
        },
      })
    },
    [dispatch, state.tasks],
  )

  const reorderQueued = useCallback(
    (activeId: string, overId: string) => {
      dispatch({ type: 'REORDER_QUEUED', activeId, overId })
    },
    [dispatch],
  )

  const addTask = useCallback(
    (params: AddTaskParams) => {
      dispatch({
        type: 'ADD_TASK',
        task: {
          id: createTaskId(),
          prompt: params.prompt,
          type: params.type,
          model: params.model,
          status: 'queued',
          progress: 0,
          createdAt: Date.now(),
          credits: params.credits,
        },
      })
    },
    [dispatch],
  )

  const enqueueFromChat = useCallback(
    (text: string, modelName: string, credits: number) => {
      const prompt = text.length > 120 ? `${text.slice(0, 120)}…` : text
      addTask({ prompt, type: 'text', model: modelName, credits })
    },
    [addTask],
  )

  const addTestTask = useCallback(() => {
    if (!import.meta.env.DEV) return
    const tpl = TEST_PROMPTS[testCounter % TEST_PROMPTS.length]
    testCounter += 1
    addTask(tpl)
  }, [addTask])

  const clearDone = useCallback(() => {
    const snapshot = state.tasks.filter((t) => t.status === 'done')
    if (snapshot.length === 0) return

    dispatch({ type: 'CLEAR_DONE' })
    toast('Готовые задачи удалены', {
      duration: 5000,
      action: {
        label: 'Отменить',
        onClick: () => dispatch({ type: 'RESTORE_TASKS', tasks: snapshot }),
      },
    })
  }, [dispatch, state.tasks])

  return {
    tasks: ctx.filteredTasks,
    allTasks: state.tasks,
    stats: ctx.stats,
    initStatus: state.initStatus,
    filter: ctx.filter,
    setFilter: ctx.setFilter,
    sort: ctx.sort,
    setSort: ctx.setSort,
    search: ctx.search,
    setSearch: ctx.setSearch,
    typeFilter: ctx.typeFilter,
    setTypeFilter: ctx.setTypeFilter,
    activeCount: ctx.activeCount,
    avgProgress: ctx.avgProgress,
    topActive: ctx.topActive,
    cancel,
    retry,
    remove,
    reorderQueued,
    clearDone,
    retryInit,
    addTask,
    enqueueFromChat,
    addTestTask,
  }
}
