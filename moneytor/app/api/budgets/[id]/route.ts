import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { budgetSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const budget = await prisma.budget.findFirst({
      where: { id, userId: user.id },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
      },
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ ...budget, amount: Number(budget.amount) });
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = budgetSchema.parse(body);

    // Check for duplicate if category or period changed
    if (
      data.categoryId !== existingBudget.categoryId ||
      data.period !== existingBudget.period
    ) {
      const duplicate = await prisma.budget.findFirst({
        where: {
          userId: user.id,
          categoryId: data.categoryId,
          period: data.period,
          NOT: { id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "A budget for this category and period already exists" },
          { status: 400 }
        );
      }
    }

    const budget = await prisma.budget.update({
      where: { id },
      data,
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
      },
    });

    return NextResponse.json({ ...budget, amount: Number(budget.amount) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    await prisma.budget.delete({ where: { id } });

    return NextResponse.json({ message: "Budget deleted" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    );
  }
}
