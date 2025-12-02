import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { accountSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      include: {
        institution: true,
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate current balance for each account
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const transactionSum = await prisma.transaction.aggregate({
          where: { accountId: account.id },
          _sum: { amount: true },
        });

        const totalTransactions = transactionSum._sum.amount
          ? Number(transactionSum._sum.amount)
          : 0;

        // Get sum of income vs expense
        const incomeSum = await prisma.transaction.aggregate({
          where: { accountId: account.id, type: "income" },
          _sum: { amount: true },
        });

        const expenseSum = await prisma.transaction.aggregate({
          where: { accountId: account.id, type: "expense" },
          _sum: { amount: true },
        });

        const income = incomeSum._sum.amount
          ? Number(incomeSum._sum.amount)
          : 0;
        const expense = expenseSum._sum.amount
          ? Number(expenseSum._sum.amount)
          : 0;

        const calculatedBalance =
          Number(account.startingBalance) + income - expense;

        return {
          ...account,
          startingBalance: Number(account.startingBalance),
          currentBalance: account.currentBalance
            ? Number(account.currentBalance)
            : calculatedBalance,
          availableBalance: account.availableBalance
            ? Number(account.availableBalance)
            : null,
          creditLimit: account.creditLimit
            ? Number(account.creditLimit)
            : null,
          calculatedBalance,
        };
      })
    );

    return NextResponse.json(accountsWithBalance);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = accountSchema.parse(body);

    const account = await prisma.account.create({
      data: {
        ...data,
        userId: user.id,
        startingBalance: data.startingBalance,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
