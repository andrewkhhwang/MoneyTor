import { createClient } from '@/utils/supabase/server'
import { plaidClient } from '@/lib/plaid'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { public_token } = await request.json()

  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    const { access_token, item_id } = response.data

    // Store connection in Supabase
    const { error } = await supabase.from('user_connections').insert({
      user_id: user.id,
      provider: 'plaid',
      item_id,
      access_token, // Note: In production, encrypt this!
    })

    if (error) {
      console.error('Error storing connection:', error)
      return NextResponse.json(
        { error: 'Failed to store connection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    )
  }
}
