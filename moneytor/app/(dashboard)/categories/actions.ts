'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const name = formData.get('name') as string
  const type = formData.get('type') as string

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name,
    type,
  })

  if (error) {
    console.error('Error creating category:', error)
    return
  }

  revalidatePath('/categories')
}
