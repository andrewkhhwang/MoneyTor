import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getPeriodRange, isAssetAccount } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || getCurrentPeriod();
    const range = getPeriodRange(period);

    // Get all accounts with calculated balances
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
    });

    const accountBalances = await Promise.all(
      accounts.map(async (account) => {
        const incomeSum = await prisma.transaction.aggregate({
          where: { accountId: account.id, type: "income" },
          _sum: { amount: true },
        });

        const expenseSum = await prisma.transaction.aggregate({
          where: { accountId: account.id, type: "expense" },
          _sum: { amount: true },
        });

        const income = incomeSum._sum.amount ? Number(incomeSum._sum.amount) : 0;
        const expense = expenseSum._sum.amount ? Number(expenseSum._sum.amount) : 0;

        return {
          ...account,
          startingBalance: Number(account.startingBalance),
          calculatedBalance: Number(account.startingBalance) + income - expense,
        };
      })
    );

    // Calculate net worth
    const assets = accountBalances
      .filter((a) => isAssetAccount(a.type))
      .reduce((sum, a) => sum + a.calculatedBalance, 0);

    const liabilities = accountBalances
      .filter((a) => !isAssetAccount(a.type))
      .reduce((sum, a) => sum + Math.abs(a.calculatedBalance), 0);

    const netWorth = assets - liabilities;

    // Get period totals
    const periodIncome = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: "income",
        date: { gte: range.start, lte: range.end },
      },
      _sum: { amount: true },
    });

    const periodExpense = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: "expense",
        date: { gte: range.start, lte: range.end },
      },
      _sum: { amount: true },
    });

    const totalIncome = periodIncome._sum.amount
      ? Number(periodIncome._sum.amount)
      : 0;
    const totalExpense = periodExpense._sum.amount
      ? Number(periodExpense._sum.amount)
      : 0;

    // Get spending by category
    const categorySpending = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId: user.id,
        type: "expense",
        date: { gte: range.start, lte: range.end },
        categoryId: { not: null },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 8,
    });

    // Get category details
    const categoryIds = categorySpending.map((c) => c.categoryId).filter(Boolean) as string[];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const spendingByCategory = categorySpending.map((item) => {
      const category = categoryMap.get(item.categoryId!);
      return {
        name: category?.name || "Unknown",
        icon: category?.icon,
        color: category?.color || "#6b7280",
        amount: item._sum.amount ? Number(item._sum.amount) : 0,
      };
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        account: { select: { name: true } },
        category: { select: { name: true, icon: true, color: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
    });

    // Get budget status for period
    const budgets = await prisma.budget.findMany({
      where: { userId: user.id, period },
      include: { category: { select: { name: true, icon: true, color: true } } },
    });

    const budgetStatus = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            userId: user.id,
            categoryId: budget.categoryId,
            type: "expense",
            date: { gte: range.start, lte: range.end },
          },
          _sum: { amount: true },
        });

        return {
          category: budget.category.name,
          icon: budget.category.icon,
          color: budget.category.color,
          budget: Number(budget.amount),
          spent: spent._sum.amount ? Number(spent._sum.amount) : 0,
        };
      })
    );

    // Get daily spending for the period (for chart)
    const dailyTransactions = await prisma.transaction.groupBy({
      by: ["date", "type"],
      where: {
        userId: user.id,
        date: { gte: range.start, lte: range.end },
        type: { in: ["income", "expense"] },
      },
      _sum: { amount: true },
      orderBy: { date: "asc" },
    });

    // Build daily data map
    const dailyData: Record<string, { date: string; income: number; expense: number }> = {};

    dailyTransactions.forEach((item) => {
      const dateStr = new Date(item.date).toISOString().split("T")[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { date: dateStr, income: 0, expense: 0 };
      }
      if (item.type === "income") {
        dailyData[dateStr].income = item._sum.amount ? Number(item._sum.amount) : 0;
      } else {
        dailyData[dateStr].expense = item._sum.amount ? Number(item._sum.amount) : 0;
      }
    });

    const chartData = Object.values(dailyData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      period,
      summary: {
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
        assets,
        liabilities,
        netWorth,
      },
      accounts: accountBalances.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: a.calculatedBalance,
      })),
      spendingByCategory,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        date: t.date,
        description: t.description,
        account: t.account.name,
        category: t.category
          ? {
              name: t.category.name,
              icon: t.category.icon,
              color: t.category.color,
            }
          : null,
      })),
      budgetStatus,
      chartData,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
