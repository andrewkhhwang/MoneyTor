import { createClient } from '@/utils/supabase/server'
import { createBudget } from './actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const period = searchParams.period || new Date().toISOString().slice(0, 7) // YYYY-MM

  // Fetch budgets for the period
  const { data: budgets } = await supabase
    .from('budgets')
    .select(`
      *,
      category:categories(name)
    `)
    .eq('user_id', user?.id)
    .eq('period', period)

  // Fetch actual spending for each category in this period
  const startDate = `${period}-01`
  const endDate = `${period}-31` // Simple approximation

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, category_id')
    .eq('user_id', user?.id)
    .eq('type', 'expense')
    .gte('date', startDate)
    .lte('date', endDate)

  // Aggregate spending by category
  const spendingByCategory: Record<string, number> = {}
  transactions?.forEach((t) => {
    if (t.category_id) {
      spendingByCategory[t.category_id] =
        (spendingByCategory[t.category_id] || 0) + Number(t.amount)
    }
  })

  // Fetch categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user?.id)
    .eq('type', 'expense')
    .order('name')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Budgets</h1>
          <p className="mt-2 text-zinc-400">Set monthly spending limits for your categories.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="period" className="text-sm font-medium text-zinc-400">
            Period:
          </label>
          <form>
            <input
              type="month"
              name="period"
              defaultValue={period}
              onChange={(e) => {
                // In a real app, use router.push or a client component to update URL
                // For now, this is just a placeholder for the concept
              }}
              className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm [color-scheme:dark]"
            />
            <button type="submit" className="hidden">
              Go
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Budget List */}
        <div className="lg:col-span-2 space-y-4">
          {budgets?.length === 0 ? (
            <Card>
              <p className="text-zinc-500">No budgets set for this period.</p>
            </Card>
          ) : (
            budgets?.map((budget) => {
              const spent = spendingByCategory[budget.category_id] || 0
              const progress = Math.min((spent / Number(budget.amount)) * 100, 100)
              const remaining = Number(budget.amount) - spent

              return (
                <Card key={budget.id}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">
                      {budget.category?.name}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {formatCurrency(spent)} of {formatCurrency(Number(budget.amount))}
                    </p>
                  </div>
                  <div className="mt-4 relative pt-1">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-zinc-800">
                      <div
                        style={{ width: `${progress}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                          progress > 90
                            ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                            : progress > 75
                            ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                            : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                        }`}
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 text-right">
                    {formatCurrency(remaining)} remaining
                  </p>
                </Card>
              )
            })
          )}
        </div>

        {/* Add Budget Form */}
        <Card className="h-fit">
          <h2 className="text-xl font-semibold text-white">Set Budget</h2>
          <form action={createBudget} className="mt-6 space-y-4">
            <input type="hidden" name="period" value={period} />

            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-zinc-400"
              >
                Category
              </label>
              <select
                name="categoryId"
                id="categoryId"
                required
                className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
              >
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-zinc-400"
              >
                Budget Amount
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-zinc-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  step="0.01"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-black/50 pl-7 px-3 py-2 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Set Budget
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
