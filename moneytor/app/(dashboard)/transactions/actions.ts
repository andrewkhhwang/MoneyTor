'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const description = formData.get('description') as string
  const amount = parseFloat(formData.get('amount') as string)
  const type = formData.get('type') as string
  const accountId = formData.get('accountId') as string
  const categoryId = formData.get('categoryId') as string
  const date = formData.get('date') as string

  // Insert transaction
  const { error: transactionError } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: accountId,
    category_id: categoryId || null,
    description,
    amount,
    type,
    date: new Date(date).toISOString(),
  })

  if (transactionError) {
    console.error('Error creating transaction:', transactionError)
    return
  }

  // Update account balance
  // For expenses, we subtract. For income, we add.
  // Note: This is a simple implementation. In a real app, you'd want to use a database transaction or trigger.
  const balanceChange = type === 'expense' ? -amount : amount

  // Fetch current account balance first to be safe, or use an RPC call to increment
  const { data: account } = await supabase
    .from('accounts')
    .select('current_balance')
    .eq('id', accountId)
    .single()

  if (account) {
    const newBalance = (account.current_balance || 0) + balanceChange
    await supabase
      .from('accounts')
      .update({ current_balance: newBalance })
      .eq('id', accountId)
  }

  revalidatePath('/transactions')
  revalidatePath('/accounts')
  revalidatePath('/')
}
