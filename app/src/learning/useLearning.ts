import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.ts'
import type { LearningRecord } from '@scroll-up/shared'
export function useLearning() {
  const [items, setItems] = useState<LearningRecord[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('')
  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems((await api.learning()).items)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void reload()
  }, [reload])
  return { items, loading, error, reload }
}
