import { createClient } from '@/utils/supabase/server'
import { createAccount } from './actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

export default async function AccountsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Accounts</h1>
          <p className="mt-2 text-zinc-400">Manage your connected bank accounts and manual wallets.</p>
        </div>
        <div className="flex gap-2">
          {/* Manual sync or other actions can go here */}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Account List */}
        <Card>
          <h2 className="text-xl font-semibold text-white">Your Accounts</h2>
          <div className="mt-6 space-y-4">
            {accounts?.length === 0 ? (
              <p className="text-zinc-500">No accounts found.</p>
            ) : (
              accounts?.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-white">{account.name}</p>
                    <p className="text-sm text-zinc-500 capitalize">
                      {account.type.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">
                      {formatCurrency(account.current_balance)}
                    </p>
                    {account.is_sync_enabled && (
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                        Linked
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Add Account Form */}
        <Card className="h-fit">
          <h2 className="text-xl font-semibold text-white">Add Manual Account</h2>
          <form action={createAccount} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-400"
              >
                Account Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
                placeholder="e.g. Cash Wallet"
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
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit_card">Credit Card</option>
                <option value="investment">Investment</option>
                <option value="loan">Loan</option>
                <option value="manual_cash">Cash</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="balance"
                className="block text-sm font-medium text-zinc-400"
              >
                Starting Balance
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-zinc-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="balance"
                  id="balance"
                  step="0.01"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-black/50 pl-7 pr-12 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Add Account
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
