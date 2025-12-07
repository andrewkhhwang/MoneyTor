'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

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
    <Button
      onClick={() => open()}
      disabled={!ready}
      variant="primary"
    >
      Connect a Bank Account
    </Button>
  )
}
