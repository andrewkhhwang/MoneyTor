'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Settings,
  LogOut,
  PieChart,
  List,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: List },
  { name: 'Accounts', href: '/accounts', icon: CreditCard },
  { name: 'Categories', href: '/categories', icon: PieChart },
  { name: 'Budgets', href: '/budgets', icon: Wallet },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-white/10 bg-black text-white">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold tracking-tight">
          Money<span className="text-violet-500">Tor</span>
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-violet-600/10 text-violet-400 shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-white'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="mr-3 h-5 w-5 text-zinc-500 transition-colors group-hover:text-red-400" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
