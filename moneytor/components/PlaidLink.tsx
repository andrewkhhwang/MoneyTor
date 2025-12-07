'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { useRouter } from 'next/navigation'

export default function PlaidLink() {
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const createLinkToken = async () => {
      const response = await fetch('/api/plaid/link-token', {
        method: 'POST',
      })
      const { link_token } = await response.json()
      setToken(link_token)
    }
    createLinkToken()
  }, [])

  const onSuccess = useCallback(
    async (public_token: string) => {
      await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token }),
      })
      router.refresh()
    },
    [router]
  )

  const { open, ready } = usePlaidLink({
    token,
    onSuccess,
  })

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
    >
      Connect a Bank Account
    </button>
  )
}
