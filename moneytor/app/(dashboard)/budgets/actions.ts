'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createBudget(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const categoryId = formData.get('categoryId') as string
  const amount = parseFloat(formData.get('amount') as string)
  const period = formData.get('period') as string // YYYY-MM

  const { error } = await supabase.from('budgets').insert({
    user_id: user.id,
    category_id: categoryId,
    amount,
    period,
  })

  if (error) {
    console.error('Error creating budget:', error)
    return
  }

  revalidatePath('/budgets')
}
