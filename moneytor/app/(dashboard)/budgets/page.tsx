import { createClient } from '@/utils/supabase/server'
import { createBudget } from './actions'

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
  // Note: This is a bit complex in pure Supabase JS client without aggregation functions easily available on the client side without RPC.
  // We will fetch all expense transactions for this month and aggregate in JS for now.
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
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Budgets</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="period" className="text-sm font-medium text-gray-700">
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
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <button type="submit" className="hidden">
              Go
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Budget List */}
        <div className="lg:col-span-2 space-y-4">
          {budgets?.length === 0 ? (
            <div className="rounded-lg bg-white p-6 shadow">
              <p className="text-gray-500">No budgets set for this period.</p>
            </div>
          ) : (
            budgets?.map((budget) => {
              const spent = spendingByCategory[budget.category_id] || 0
              const progress = Math.min((spent / Number(budget.amount)) * 100, 100)
              const remaining = Number(budget.amount) - spent

              return (
                <div key={budget.id} className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {budget.category?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ${spent.toFixed(2)} of ${Number(budget.amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-2 relative pt-1">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${progress}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          progress > 90
                            ? 'bg-red-500'
                            : progress > 75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-right">
                    ${remaining.toFixed(2)} remaining
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* Add Budget Form */}
        <div className="rounded-lg bg-white p-6 shadow h-fit">
          <h2 className="text-lg font-medium text-gray-900">Set Budget</h2>
          <form action={createBudget} className="mt-4 space-y-4">
            <input type="hidden" name="period" value={period} />

            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <select
                name="categoryId"
                id="categoryId"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                className="block text-sm font-medium text-gray-700"
              >
                Budget Amount
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  step="0.01"
                  required
                  className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Set Budget
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
