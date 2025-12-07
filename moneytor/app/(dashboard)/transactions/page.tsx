import { createClient } from '@/utils/supabase/server'
import { createTransaction } from './actions'

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
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Transaction List */}
        <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
          <div className="mt-4 flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {transactions?.length === 0 ? (
                <li className="py-5">
                  <p className="text-gray-500">No transactions found.</p>
                </li>
              ) : (
                transactions?.map((transaction) => (
                  <li key={transaction.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {transaction.category?.name || 'Uncategorized'} •{' '}
                          {transaction.account?.name} •{' '}
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}$
                          {transaction.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Add Transaction Form */}
        <div className="rounded-lg bg-white p-6 shadow h-fit">
          <h2 className="text-lg font-medium text-gray-900">Add Transaction</h2>
          <form action={createTransaction} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <input
                type="text"
                name="description"
                id="description"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Amount
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

              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700"
                >
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700"
              >
                Type
              </label>
              <select
                name="type"
                id="type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="accountId"
                className="block text-sm font-medium text-gray-700"
              >
                Account
              </label>
              <select
                name="accountId"
                id="accountId"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                className="block text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <select
                name="categoryId"
                id="categoryId"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Uncategorized</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Add Transaction
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
