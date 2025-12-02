import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum([
    "checking",
    "savings",
    "credit_card",
    "investment",
    "loan",
    "mortgage",
    "manual_cash",
  ]),
  currency: z.string().default("USD"),
  startingBalance: z.coerce.number().default(0),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  type: z.enum(["income", "expense"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const transactionSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().optional().nullable(),
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.coerce.date(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Period must be in YYYY-MM format"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

export type AccountInput = z.infer<typeof accountSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
