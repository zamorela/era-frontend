import { useEffect } from 'react'
import { GenerationQueueWidget } from '@/widgets/generation-queue'

export default function QueuePage() {
  useEffect(() => {
    const prev = document.title
    document.title = 'ERA2 — Очередь генераций'
    return () => { document.title = prev }
  }, [])

  return <GenerationQueueWidget />
}
