import { useState, useEffect, useCallback } from 'react'

interface LicenseState {
  status: string
  licenseKey?: string
  licenseType?: string
  tier?: string
  expiresAt?: string
  lastValidated?: string
  errorMessage?: string
}

export function useLicense() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<LicenseState | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const state = await window.electronAPI.license.initialize()
      setStatus(state)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const activate = useCallback(async (key: string) => {
    const result = await window.electronAPI.license.activate(key)
    if (result.status === 'active' || result.status === 'grace_period') {
      setStatus(result)
    }
    return result
  }, [])

  const deactivate = useCallback(async () => {
    await window.electronAPI.license.deactivate()
    setStatus(null)
  }, [])

  const isActive = status?.status === 'active'
    || status?.status === 'grace_period'
    || status?.status === 'offline'

  const tier = status?.licenseType ?? status?.tier

  return { loading, status, isActive, tier, refresh, activate, deactivate }
}
