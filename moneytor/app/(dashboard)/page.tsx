import { createClient } from '@/utils/supabase/server'
import { ArrowDownIcon, ArrowUpIcon, WalletIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { NetWorthChart } from '@/components/NetWorthChart'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString()

  // Fetch transactions for current month (for stats)
  const { data: currentMonthTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user?.id)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  // Calculate totals
  const income = currentMonthTransactions
    ?.filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0

  const expenses = currentMonthTransactions
    ?.filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0

  const net = income - expenses

  // Fetch accounts for net worth
  const { data: accounts } = await supabase
    .from('accounts')
    .select('current_balance, type')
    .eq('user_id', user?.id)

  const currentNetWorth = accounts?.reduce((sum, a) => {
    if (['credit_card', 'loan'].includes(a.type)) {
      return sum - Number(a.current_balance)
    }
    return sum + Number(a.current_balance)
  }, 0) || 0

  // Fetch transactions for last 30 days (for chart)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: historyTransactions } = await supabase
    .from('transactions')
    .select('amount, type, date')
    .eq('user_id', user?.id)
    .gte('date', thirtyDaysAgo.toISOString())
    .order('date', { ascending: true })

  // Calculate daily net worth
  const chartData = []
  let runningBalance = currentNetWorth

  // We iterate backwards from today to 30 days ago
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Add point for end of this day
    chartData.unshift({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: runningBalance
    })

    // Adjust running balance for the previous day
    // To go back in time: subtract income, add expense
    const dayTransactions = historyTransactions?.filter(t => 
      t.date.startsWith(dateStr)
    ) || []

    const dayIncome = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const dayExpense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    runningBalance = runningBalance - dayIncome + dayExpense
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 text-zinc-400">Overview of your financial health.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-green-500/10 blur-2xl" />
          <div className="flex items-center">
            <div className="rounded-lg bg-green-500/10 p-3">
              <ArrowUpIcon className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-400">Income</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(income)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-red-500/10 blur-2xl" />
          <div className="flex items-center">
            <div className="rounded-lg bg-red-500/10 p-3">
              <ArrowDownIcon className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-400">Expenses</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(expenses)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <WalletIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-400">Net Flow</p>
              <p className={`text-2xl font-bold ${net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(net)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-violet-500/20 bg-violet-500/5">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="flex items-center">
            <div className="rounded-lg bg-violet-500/10 p-3">
              <WalletIcon className="h-6 w-6 text-violet-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-zinc-400">Net Worth</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(currentNetWorth)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Net Worth Chart */}
      <div className="space-y-4">
        <NetWorthChart data={chartData} />
      </div>
    </div>
  )
}
