import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { transactionSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const type = searchParams.get("type");
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = { userId: user.id };

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, Date>).gte = new Date(from);
      if (to) (where.date as Record<string, Date>).lte = new Date(to);
    }

    if (type) where.type = type;
    if (accountId) where.accountId = accountId;
    if (categoryId) where.categoryId = categoryId;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: limit ? parseInt(limit) : undefined,
    });

    const formattedTransactions = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
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
    const data = transactionSchema.parse(body);

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Verify category belongs to user (if provided)
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: user.id },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        userId: user.id,
        categoryId: data.categoryId || null,
      },
      include: {
        account: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
    });

    return NextResponse.json(
      { ...transaction, amount: Number(transaction.amount) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
