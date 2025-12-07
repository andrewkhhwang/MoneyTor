import { createClient } from '@/utils/supabase/server'
import { plaidClient } from '@/lib/plaid'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
      // Simple sync: fetch last 30 days
      // In production, use cursor-based /transactions/sync API
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      const startString = startDate.toISOString().split('T')[0]
      const endString = new Date().toISOString().split('T')[0]

      const response = await plaidClient.transactionsGet({
        access_token: connection.access_token,
        start_date: startString,
        end_date: endString,
      })

      const transactions = response.data.transactions

      for (const transaction of transactions) {
        // Find our account ID for this transaction
        const { data: account } = await supabase
          .from('accounts')
          .select('id')
          .eq('provider_account_id', transaction.account_id)
          .single()

        if (!account) continue

        // Check if transaction exists
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('provider_transaction_id', transaction.transaction_id)
          .single()

        if (existing) {
          // Update?
          continue
        }

        // Map category
        // Simple mapping based on Plaid's primary category
        // In a real app, you'd have a more sophisticated mapping engine
        let categoryId = null
        if (transaction.category && transaction.category.length > 0) {
          const plaidCat = transaction.category[0]
          // Try to find a matching category by name
          const { data: cat } = await supabase
            .from('categories')
            .select('id')
            .ilike('name', `%${plaidCat}%`)
            .eq('user_id', user.id)
            .limit(1)
            .single()
          
          if (cat) categoryId = cat.id
        }

        await supabase.from('transactions').insert({
          user_id: user.id,
          account_id: account.id,
          provider_transaction_id: transaction.transaction_id,
          amount: Math.abs(transaction.amount), // Plaid sends positive for expense usually, but let's be safe
          type: transaction.amount > 0 ? 'expense' : 'income', // Plaid: positive = expense, negative = refund/income
          date: transaction.date,
          description: transaction.name,
          merchant_name: transaction.merchant_name,
          category_id: categoryId,
          pending: transaction.pending,
        })
        syncedCount++
      }
    } catch (error) {
      console.error(`Error syncing transactions for connection ${connection.id}:`, error)
    }
  }

  return NextResponse.json({ synced: syncedCount })
}
