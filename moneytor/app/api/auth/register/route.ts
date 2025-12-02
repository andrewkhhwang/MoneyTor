import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Seed default categories for the new user
    const defaultCategories = [
      // Income categories
      { name: "Salary", type: "income", icon: "💼", color: "#22c55e" },
      { name: "Freelance", type: "income", icon: "💻", color: "#10b981" },
      { name: "Investments", type: "income", icon: "📈", color: "#14b8a6" },
      { name: "Other Income", type: "income", icon: "💰", color: "#06b6d4" },
      // Expense categories
      { name: "Housing", type: "expense", icon: "🏠", color: "#ef4444" },
      { name: "Transportation", type: "expense", icon: "🚗", color: "#f97316" },
      { name: "Food & Dining", type: "expense", icon: "🍔", color: "#eab308" },
      { name: "Groceries", type: "expense", icon: "🛒", color: "#84cc16" },
      { name: "Utilities", type: "expense", icon: "💡", color: "#06b6d4" },
      { name: "Healthcare", type: "expense", icon: "🏥", color: "#8b5cf6" },
      { name: "Entertainment", type: "expense", icon: "🎬", color: "#ec4899" },
      { name: "Shopping", type: "expense", icon: "🛍️", color: "#f43f5e" },
      { name: "Subscriptions", type: "expense", icon: "📱", color: "#6366f1" },
      { name: "Insurance", type: "expense", icon: "🛡️", color: "#0ea5e9" },
      { name: "Education", type: "expense", icon: "📚", color: "#a855f7" },
      { name: "Personal Care", type: "expense", icon: "💅", color: "#d946ef" },
      { name: "Gifts & Donations", type: "expense", icon: "🎁", color: "#14b8a6" },
      { name: "Travel", type: "expense", icon: "✈️", color: "#3b82f6" },
      { name: "Other Expenses", type: "expense", icon: "📦", color: "#64748b" },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        userId: user.id,
        isSystem: true,
      })),
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
