"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  PiggyBank,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { formatCurrency, getCurrentPeriod, getPeriodLabel } from "@/lib/utils";

interface Budget {
  id: string;
  period: string;
  amount: number;
  spent: number;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
  };
}

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  color: string | null;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [period, setPeriod] = useState(getCurrentPeriod());

  // Form state
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchBudgets = useCallback(async () => {
    try {
      const response = await fetch(`/api/budgets?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      }
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch("/api/categories?type=expense");
      if (response.ok) {
        setCategories(await response.json());
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const navigatePeriod = (direction: "prev" | "next") => {
    const [year, month] = period.split("-").map(Number);
    const newDate = new Date(year, month - 1 + (direction === "next" ? 1 : -1));
    const newPeriod = `${newDate.getFullYear()}-${String(
      newDate.getMonth() + 1
    ).padStart(2, "0")}`;
    setPeriod(newPeriod);
  };

  const openAddModal = () => {
    setEditingBudget(null);
    setCategoryId("");
    setAmount("");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setCategoryId(budget.category.id);
    setAmount(budget.amount.toString());
    setError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = editingBudget
        ? `/api/budgets/${editingBudget.id}`
        : "/api/budgets";
      const method = editingBudget ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          period,
          amount: parseFloat(amount),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save budget");
        return;
      }

      setIsModalOpen(false);
      fetchBudgets();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    try {
      const response = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchBudgets();
      }
    } catch (error) {
      console.error("Failed to delete budget:", error);
    }
    setOpenMenuId(null);
  };

  // Get categories not yet budgeted for this period
  const availableCategories = categories.filter(
    (cat) => !budgets.some((b) => b.category.id === cat.id)
  );

  const categoryOptions = (
    editingBudget
      ? categories // Show all categories when editing
      : availableCategories
  ).map((c) => ({
    value: c.id,
    label: `${c.icon || "📦"} ${c.name}`,
  }));

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (percentage >= 80) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Budgets
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Set spending limits for your categories
          </p>
        </div>
        <Button onClick={openAddModal} disabled={availableCategories.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={() => navigatePeriod("prev")}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {getPeriodLabel(period)}
        </div>
        <button
          onClick={() => navigatePeriod("next")}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Budget
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalBudget)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Spent
            </div>
            <div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalSpent)}
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full transition-all ${getProgressColor(
                  totalSpent,
                  totalBudget
                )}`}
                style={{
                  width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Remaining
            </div>
            <div
              className={`mt-1 text-2xl font-bold ${
                totalRemaining >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(totalRemaining)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      {budgets.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={PiggyBank}
              title="No budgets for this period"
              description="Create budgets to track your spending by category"
              actionLabel="Add Budget"
              onAction={openAddModal}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.amount) * 100;
            const remaining = budget.amount - budget.spent;

            return (
              <Card key={budget.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                        style={{
                          backgroundColor: `${budget.category.color}20`,
                        }}
                      >
                        {budget.category.icon || "📦"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {budget.category.name}
                          </span>
                          {getStatusIcon(budget.spent, budget.amount)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency(budget.spent)} of{" "}
                          {formatCurrency(budget.amount)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div
                          className={`font-semibold ${
                            remaining >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {remaining >= 0 ? "+" : ""}
                          {formatCurrency(remaining)}
                        </div>
                        <div className="text-xs text-gray-500">remaining</div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === budget.id ? null : budget.id
                            )
                          }
                          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {openMenuId === budget.id && (
                          <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <button
                              onClick={() => openEditModal(budget)}
                              className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(budget.id)}
                              className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full transition-all ${getProgressColor(
                        budget.spent,
                        budget.amount
                      )}`}
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(0)}% used
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? "Edit Budget" : "Add Budget"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <Select
            id="categoryId"
            label="Category"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="Select a category"
            disabled={editingBudget !== null}
          />

          <Input
            id="amount"
            label="Budget Amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Budget for: <strong>{getPeriodLabel(period)}</strong>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingBudget ? "Save Changes" : "Add Budget"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
