"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  Tag,
  MoreVertical,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  _count: { transactions: number; budgets: number };
}

const categoryTypeOptions = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

const defaultColors = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState(defaultColors[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setType("expense");
    setIcon("");
    setColor(defaultColors[Math.floor(Math.random() * defaultColors.length)]);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setType(category.type);
    setIcon(category.icon || "");
    setColor(category.color || defaultColors[0]);
    setError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, icon: icon || null, color }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save category");
        return;
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    if (category._count.transactions > 0) {
      alert(
        `Cannot delete "${category.name}" because it has ${category._count.transactions} transactions.`
      );
      setOpenMenuId(null);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchCategories();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
    setOpenMenuId(null);
  };

  const filteredCategories = categories.filter((category) => {
    if (filter === "all") return true;
    return category.type === filter;
  });

  const incomeCategories = filteredCategories.filter((c) => c.type === "income");
  const expenseCategories = filteredCategories.filter(
    (c) => c.type === "expense"
  );

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  const CategoryCard = ({ category }: { category: Category }) => (
    <Card className="relative transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
            style={{ backgroundColor: `${category.color}20` }}
          >
            {category.icon || (category.type === "income" ? "💰" : "💸")}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {category.name}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{category._count.transactions} transactions</span>
              {category.isSystem && (
                <Badge variant="default" className="text-[10px]">
                  System
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() =>
              setOpenMenuId(openMenuId === category.id ? null : category.id)
            }
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {openMenuId === category.id && (
            <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => openEditModal(category)}
                className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Categories
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Organize your transactions with categories
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          All ({categories.length})
        </button>
        <button
          onClick={() => setFilter("income")}
          className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "income"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          <TrendingUp className="mr-1.5 h-4 w-4" />
          Income ({categories.filter((c) => c.type === "income").length})
        </button>
        <button
          onClick={() => setFilter("expense")}
          className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            filter === "expense"
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          <TrendingDown className="mr-1.5 h-4 w-4" />
          Expense ({categories.filter((c) => c.type === "expense").length})
        </button>
      </div>

      {filteredCategories.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Tag}
              title="No categories yet"
              description="Create categories to organize your transactions"
              actionLabel="Add Category"
              onAction={openAddModal}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Income Categories */}
          {filter !== "expense" && incomeCategories.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center text-sm font-semibold text-green-600 dark:text-green-400">
                <TrendingUp className="mr-2 h-4 w-4" />
                Income Categories
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {incomeCategories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}

          {/* Expense Categories */}
          {filter !== "income" && expenseCategories.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center text-sm font-semibold text-red-600 dark:text-red-400">
                <TrendingDown className="mr-2 h-4 w-4" />
                Expense Categories
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {expenseCategories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <Input
            id="name"
            label="Category Name"
            placeholder="e.g., Groceries"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            id="type"
            label="Type"
            options={categoryTypeOptions}
            value={type}
            onChange={(e) => setType(e.target.value as "income" | "expense")}
          />

          <Input
            id="icon"
            label="Icon (emoji)"
            placeholder="e.g., 🛒"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {defaultColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    color === c ? "scale-110 ring-2 ring-offset-2 ring-gray-400" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
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
              {editingCategory ? "Save Changes" : "Add Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
