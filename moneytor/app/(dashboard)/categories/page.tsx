import { createClient } from '@/utils/supabase/server'
import { createCategory } from './actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user?.id)
    .order('name', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Categories</h1>
        <p className="mt-2 text-zinc-400">Organize your transactions with custom categories.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Category List */}
        <Card>
          <h2 className="text-xl font-semibold text-white">Your Categories</h2>
          <div className="mt-6 space-y-4">
            {categories?.length === 0 ? (
              <p className="text-zinc-500">No categories found.</p>
            ) : (
              categories?.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0"
                >
                  <p className="font-medium text-white">{category.name}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      category.type === 'income'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {category.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Add Category Form */}
        <Card className="h-fit">
          <h2 className="text-xl font-semibold text-white">Add Category</h2>
          <form action={createCategory} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-400"
              >
                Category Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
                placeholder="e.g. Groceries"
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-zinc-400"
              >
                Type
              </label>
              <select
                name="type"
                id="type"
                className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <Button type="submit" className="w-full">
              Add Category
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
