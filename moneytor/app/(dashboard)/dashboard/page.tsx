"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Receipt,
} from "lucide-react";
import {
  formatCurrency,
  formatDateShort,
  getCurrentPeriod,
  getPeriodLabel,
  getAccountTypeLabel,
  isAssetAccount,
} from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  period: string;
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    assets: number;
    liabilities: number;
    netWorth: number;
  };
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
  }>;
  spendingByCategory: Array<{
    name: string;
    icon: string | null;
    color: string;
    amount: number;
  }>;
  recentTransactions: Array<{
    id: string;
    type: "income" | "expense" | "transfer";
    amount: number;
    date: string;
    description: string | null;
    account: string;
    category: { name: string; icon: string | null; color: string | null } | null;
  }>;
  budgetStatus: Array<{
    category: string;
    icon: string | null;
    color: string | null;
    budget: number;
    spent: number;
  }>;
  chartData: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(getCurrentPeriod());

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard?period=${period}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const navigatePeriod = (direction: "prev" | "next") => {
    const [year, month] = period.split("-").map(Number);
    const newDate = new Date(year, month - 1 + (direction === "next" ? 1 : -1));
    const newPeriod = `${newDate.getFullYear()}-${String(
      newDate.getMonth() + 1
    ).padStart(2, "0")}`;
    setPeriod(newPeriod);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-80 rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">Failed to load dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your financial overview at a glance
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigatePeriod("prev")}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-32 text-center font-medium text-gray-900 dark:text-white">
            {getPeriodLabel(period)}
          </div>
          <button
            onClick={() => navigatePeriod("next")}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Income
                </p>
                <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                  +{formatCurrency(data.summary.totalIncome)}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Expenses
                </p>
                <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                  -{formatCurrency(data.summary.totalExpense)}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Net Savings
                </p>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    data.summary.net >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(data.summary.net)}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <PiggyBank className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Net Worth
                </p>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    data.summary.netWorth >= 0
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(data.summary.netWorth)}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {data.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDateShort(value)}
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${value}`}
                    fontSize={12}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => formatDateShort(label)}
                  />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-gray-500">
                No transaction data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.spendingByCategory.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.spendingByCategory}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {data.spendingByCategory.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {data.spendingByCategory.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                          {category.icon} {category.name}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-gray-500">
                No spending data for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Link
              href="/transactions"
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {data.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                          transaction.type === "income"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : transaction.type === "expense"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                        }`}
                      >
                        {transaction.category?.icon ||
                          (transaction.type === "income" ? "💰" : "💸")}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.description ||
                            transaction.category?.name ||
                            "Uncategorized"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.account} • {formatDateShort(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-gray-500">
                <Receipt className="mb-2 h-8 w-8 text-gray-300" />
                <p>No transactions yet</p>
                <Link
                  href="/transactions"
                  className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                >
                  Add your first transaction
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accounts & Budgets */}
        <div className="space-y-6">
          {/* Accounts Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Accounts</CardTitle>
              <Link
                href="/accounts"
                className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Manage
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {data.accounts.length > 0 ? (
                <div className="space-y-3">
                  {data.accounts.slice(0, 4).map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {account.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getAccountTypeLabel(account.type)}
                        </p>
                      </div>
                      <span
                        className={`font-semibold ${
                          isAssetAccount(account.type)
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(account.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  <p>No accounts yet</p>
                  <Link
                    href="/accounts"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Add an account
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Budget Status</CardTitle>
              <Link
                href="/budgets"
                className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Manage
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {data.budgetStatus.length > 0 ? (
                <div className="space-y-3">
                  {data.budgetStatus.slice(0, 4).map((budget, index) => {
                    const percentage = (budget.spent / budget.budget) * 100;
                    return (
                      <div key={index}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            {budget.icon} {budget.category}
                          </span>
                          <span className="text-gray-500">
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full transition-all ${
                              percentage >= 100
                                ? "bg-red-500"
                                : percentage >= 80
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  <p>No budgets set</p>
                  <Link
                    href="/budgets"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Create a budget
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
