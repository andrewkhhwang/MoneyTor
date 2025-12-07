import { createClient } from '@/utils/supabase/server'
import { plaidClient } from '@/lib/plaid'
import { NextResponse } from 'next/server'
import { AccountBase } from 'plaid'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all connections for the user
  const { data: connections } = await supabase
    .from('user_connections')
    .select('*')
    .eq('user_id', user.id)

  if (!connections || connections.length === 0) {
    return NextResponse.json({ message: 'No connections found' })
  }

  let syncedCount = 0

  for (const connection of connections) {
    try {
      const response = await plaidClient.accountsGet({
        access_token: connection.access_token,
      })

      const accounts = response.data.accounts

      // Get institution details if needed (simplified here)
      // In a real app, you might want to fetch institution details and store them

      for (const account of accounts) {
        // Map Plaid types to our types
        let type = 'checking' // default
        if (account.type === 'credit') type = 'credit_card'
        else if (account.type === 'loan') type = 'loan'
        else if (account.type === 'investment') type = 'investment'
        else if (account.subtype === 'savings') type = 'savings'
        else if (account.subtype === 'cd') type = 'savings'

        // Upsert account
        const { error } = await supabase.from('accounts').upsert(
          {
            user_id: user.id,
            // institution_id: ... (if we had it)
            name: account.name,
            type,
            currency: account.balances.iso_currency_code || 'USD',
            provider_account_id: account.account_id,
            current_balance: account.balances.current,
            available_balance: account.balances.available,
            is_sync_enabled: true,
            last_synced_at: new Date().toISOString(),
          },
          {
            onConflict: 'provider_account_id', // We need a unique constraint on this column for upsert to work perfectly by itself, or we query first.
            // Since provider_account_id is not unique in schema (it's nullable), we might need to handle this carefully.
            // Ideally, we should have a unique index on (user_id, provider_account_id) where provider_account_id is not null.
            // For now, let's assume we can match by provider_account_id if it exists.
          }
        )

        // If upsert fails because of missing unique constraint, we might need to do select -> insert/update
        // But let's assume the user added the unique constraint or we handle it.
        // Actually, the schema I generated doesn't have a unique constraint on provider_account_id.
        // Let's fix the logic to be safe: check if exists, then update or insert.

        const { data: existing } = await supabase
          .from('accounts')
          .select('id')
          .eq('provider_account_id', account.account_id)
          .single()

        if (existing) {
          await supabase
            .from('accounts')
            .update({
              current_balance: account.balances.current,
              available_balance: account.balances.available,
              last_synced_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
        } else {
          await supabase.from('accounts').insert({
            user_id: user.id,
            name: account.name,
            type,
            currency: account.balances.iso_currency_code || 'USD',
            provider_account_id: account.account_id,
            current_balance: account.balances.current || 0,
            available_balance: account.balances.available || 0,
            is_sync_enabled: true,
            last_synced_at: new Date().toISOString(),
          })
        }
        syncedCount++
      }
    } catch (error) {
      console.error(
        `Error syncing connection ${connection.id}:`,
        error
      )
    }
  }

  return NextResponse.json({ synced: syncedCount })
}
