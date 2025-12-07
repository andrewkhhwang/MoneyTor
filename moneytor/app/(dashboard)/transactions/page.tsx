import { createClient } from '@/utils/supabase/server'
import { createTransaction } from './actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch transactions with related data
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      account:accounts(name),
      category:categories(name)
    `)
    .eq('user_id', user?.id)
    .order('date', { ascending: false })

  // Fetch accounts and categories for the form
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('user_id', user?.id)
    .order('name')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user?.id)
    .order('name')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Transactions</h1>
        <p className="mt-2 text-zinc-400">View and manage your income and expenses.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Transaction List */}
        <Card className="lg:col-span-2 p-0">
          <div className="p-6 pb-4">
            <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-hidden">
            <ul className="divide-y divide-white/5">
              {transactions?.length === 0 ? (
                <li className="p-6 text-center text-zinc-500">
                  No transactions found.
                </li>
              ) : (
                transactions?.map((transaction) => (
                  <li key={transaction.id} className="p-6 transition-colors hover:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {transaction.description || 'No description'}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {transaction.category?.name || 'Uncategorized'} • {transaction.account?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className={`text-sm font-medium ${
                          transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount)).replace('$', '')}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </Card>

        {/* Add Transaction Form */}
        <Card className="h-fit">
          <h2 className="text-xl font-semibold text-white">Add Transaction</h2>
          <form action={createTransaction} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-zinc-400"
              >
                Description
              </label>
              <input
                type="text"
                name="description"
                id="description"
                required
                className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-zinc-400"
                >
                  Amount
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

              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-zinc-400"
                >
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm [color-scheme:dark]"
                />
              </div>
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

            <div>
              <label
                htmlFor="accountId"
                className="block text-sm font-medium text-zinc-400"
              >
                Account
              </label>
              <select
                name="accountId"
                id="accountId"
                required
                className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
              >
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

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
                className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
              >
                <option value="">Uncategorized</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full">
              Add Transaction
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
