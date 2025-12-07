'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

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
    <button
      onClick={handleSync}
      disabled={loading}
      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
    >
      <RefreshCw
        className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
      />
      {loading ? 'Syncing...' : 'Sync Data'}
    </button>
  )
}
