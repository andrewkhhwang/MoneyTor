import { signup } from '../login/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { WalletIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function SignupPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center bg-black px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-violet-500/10 p-3">
                <WalletIcon className="h-10 w-10 text-violet-500" />
              </div>
              <span className="text-4xl font-bold text-white">
                Money<span className="text-violet-500">Tor</span>
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white text-center">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-zinc-400 text-center">
              Start tracking your net worth today
            </p>
          </div>

          <Card className="py-8 px-4 sm:px-10">
            <form className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-400"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-400"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="block w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                formAction={signup}
                className="w-full"
              >
                Sign up
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-zinc-900 px-2 text-zinc-500">
                    Or
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center text-sm">
                <span className="text-zinc-400">Already have an account? </span>
                <Link href="/login" className="font-medium text-violet-500 hover:text-violet-400">
                  Sign in
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block relative bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-black/50 mix-blend-overlay z-10" />
        <Image
          src="/dashboard_preview_1765142186327.png"
          alt="Dashboard Preview"
          fill
          className="object-cover object-left"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium text-white">
              &ldquo;MoneyTor has completely transformed how I track my finances. The dark mode is beautiful and the insights are invaluable.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">
              — Alex Chen, Product Designer
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
