import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { budgetSchema } from "@/lib/validations";
import { z } from "zod";
import { getPeriodRange } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");

    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        ...(period && { period }),
      },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
      },
      orderBy: { category: { name: "asc" } },
    });

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const range = getPeriodRange(budget.period);

        const spent = await prisma.transaction.aggregate({
          where: {
            userId: user.id,
            categoryId: budget.categoryId,
            type: "expense",
            date: {
              gte: range.start,
              lte: range.end,
            },
          },
          _sum: { amount: true },
        });

        return {
          ...budget,
          amount: Number(budget.amount),
          spent: spent._sum.amount ? Number(spent._sum.amount) : 0,
        };
      })
    );

    return NextResponse.json(budgetsWithSpent);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
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
    const data = budgetSchema.parse(body);

    // Verify category belongs to user and is expense type
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: user.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (category.type !== "expense") {
      return NextResponse.json(
        { error: "Budgets can only be created for expense categories" },
        { status: 400 }
      );
    }

    // Check for existing budget for this category+period
    const existing = await prisma.budget.findFirst({
      where: {
        userId: user.id,
        categoryId: data.categoryId,
        period: data.period,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A budget for this category and period already exists" },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.create({
      data: {
        ...data,
        userId: user.id,
      },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
      },
    });

    return NextResponse.json(
      { ...budget, amount: Number(budget.amount), spent: 0 },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}
