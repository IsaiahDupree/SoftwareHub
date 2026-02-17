import { useState, useEffect, useCallback } from 'react'
import type { LicenseStatus } from '../types'

export function useLicense() {
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const result = await window.electronAPI.license.initialize()
      setStatus(result)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const activate = useCallback(async (key: string) => {
    setLoading(true)
    try {
      const result = await window.electronAPI.license.activate(key)
      if (result.success) {
        await refresh()
        return { success: true }
      }
      return { success: false, error: result.error ?? 'Activation failed' }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const deactivate = useCallback(async () => {
    setLoading(true)
    try {
      await window.electronAPI.license.deactivate()
      await refresh()
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const isActive = status?.status === 'active' || status?.status === 'grace_period'

  return { status, loading, error, isActive, activate, deactivate, refresh }
}
