'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAccount(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const balance = parseFloat(formData.get('balance') as string)

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name,
    type,
    starting_balance: balance,
    current_balance: balance,
    available_balance: balance,
    is_sync_enabled: false,
  })

  if (error) {
    console.error('Error creating account:', error)
    // Handle error (e.g., return to form with error message)
    return
  }

  revalidatePath('/accounts')
}
