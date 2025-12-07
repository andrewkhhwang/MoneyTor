import { createClient } from '@/utils/supabase/server'
import { ArrowDownIcon, ArrowUpIcon, WalletIcon } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString()

  // Fetch transactions for current month
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user?.id)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  // Calculate totals
  const income = transactions
    ?.filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0

  const expenses = transactions
    ?.filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0

  const net = income - expenses

  // Fetch accounts for net worth
  const { data: accounts } = await supabase
    .from('accounts')
    .select('current_balance, type')
    .eq('user_id', user?.id)

  const netWorth = accounts?.reduce((sum, a) => {
    // Simple logic: credit cards and loans are liabilities (negative)
    // In our schema, balances might be stored as positive numbers, so we need to subtract liabilities
    // However, usually credit card balance is positive representing debt.
    // Let's assume 'credit_card' and 'loan' are liabilities.
    if (['credit_card', 'loan'].includes(a.type)) {
      return sum - Number(a.current_balance)
    }
    return sum + Number(a.current_balance)
  }, 0) || 0

  // Fetch recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(name),
      account:accounts(name)
    `)
    .eq('user_id', user?.id)
    .order('date', { ascending: false })
    .limit(5)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="rounded-md bg-green-100 p-3">
              <ArrowUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Income</p>
              <p className="text-lg font-semibold text-gray-900">
                ${income.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="rounded-md bg-red-100 p-3">
              <ArrowDownIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expenses</p>
              <p className="text-lg font-semibold text-gray-900">
                ${expenses.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="rounded-md bg-blue-100 p-3">
              <WalletIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Flow</p>
              <p className={`text-lg font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${net.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="rounded-md bg-purple-100 p-3">
              <WalletIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Worth</p>
              <p className="text-lg font-semibold text-gray-900">
                ${netWorth.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <ul className="divide-y divide-gray-200">
            {recentTransactions?.length === 0 ? (
              <li className="p-6 text-center text-gray-500">
                No recent transactions
              </li>
            ) : (
              recentTransactions?.map((transaction) => (
                <li key={transaction.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.category?.name || 'Uncategorized'} • {transaction.account?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
