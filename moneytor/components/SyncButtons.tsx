'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function SyncButtons() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    try {
      // Sync accounts
      await fetch('/api/plaid/sync/accounts', { method: 'POST' })
      // Sync transactions
      await fetch('/api/plaid/sync/transactions', { method: 'POST' })
      
      router.refresh()
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSync}
      disabled={loading}
      variant="secondary"
    >
      <RefreshCw
        className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
      />
      {loading ? 'Syncing...' : 'Sync Data'}
    </Button>
  )
}
