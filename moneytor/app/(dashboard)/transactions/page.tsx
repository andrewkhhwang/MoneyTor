"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  Receipt,
  MoreVertical,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Filter,
  Search,
} from "lucide-react";
import { formatCurrency, formatDate, getCurrentPeriod, getPeriodRange } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  date: string;
  description: string | null;
  notes: string | null;
  account: { id: string; name: string; type: string };
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
}

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
  color: string | null;
}

const transactionTypeOptions = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

const periodOptions = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "this_year", label: "This Year" },
  { value: "all", label: "All Time" },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filters
  const [period, setPeriod] = useState("this_month");
  const [filterType, setFilterType] = useState<string>("");
  const [filterAccountId, setFilterAccountId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [type, setType] = useState<"income" | "expense" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const getDateRange = useCallback(() => {
    const now = new Date();
    const currentPeriod = getCurrentPeriod();

    switch (period) {
      case "this_month":
        return getPeriodRange(currentPeriod);
      case "last_month": {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        const p = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
        return getPeriodRange(p);
      }
      case "last_3_months": {
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
      }
      case "this_year": {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start, end };
      }
      default:
        return null;
    }
  }, [period]);

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      const range = getDateRange();

      if (range) {
        params.set("from", range.start.toISOString());
        params.set("to", range.end.toISOString());
      }

      if (filterType) params.set("type", filterType);
      if (filterAccountId) params.set("accountId", filterAccountId);

      const response = await fetch(`/api/transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterAccountId, filterType, getDateRange]);

  useEffect(() => {
    const fetchData = async () => {
      const [accountsRes, categoriesRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/categories"),
      ]);

      if (accountsRes.ok) setAccounts(await accountsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    };

    fetchData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const openAddModal = () => {
    setEditingTransaction(null);
    setType("expense");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setAccountId(accounts[0]?.id || "");
    setCategoryId("");
    setDescription("");
    setNotes("");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setType(transaction.type);
    setAmount(transaction.amount.toString());
    setDate(new Date(transaction.date).toISOString().split("T")[0]);
    setAccountId(transaction.account.id);
    setCategoryId(transaction.category?.id || "");
    setDescription(transaction.description || "");
    setNotes(transaction.notes || "");
    setError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = editingTransaction
        ? `/api/transactions/${editingTransaction.id}`
        : "/api/transactions";
      const method = editingTransaction ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          date: new Date(date),
          accountId,
          categoryId: categoryId || null,
          description: description || null,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save transaction");
        return;
      }

      setIsModalOpen(false);
      fetchTransactions();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchTransactions();
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
    setOpenMenuId(null);
  };

  const filteredCategories = categories.filter(
    (c) => c.type === type || type === "transfer"
  );

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));
  const categoryOptions = [
    { value: "", label: "No category" },
    ...filteredCategories.map((c) => ({
      value: c.id,
      label: `${c.icon || ""} ${c.name}`.trim(),
    })),
  ];

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.description?.toLowerCase().includes(query) ||
      t.category?.name.toLowerCase().includes(query) ||
      t.account.name.toLowerCase().includes(query)
    );
  });

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "expense":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-gray-700" />
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
            Transactions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track your income and expenses
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Income</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                +{formatCurrency(totalIncome)}
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200 dark:text-green-800" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Expenses</div>
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                -{formatCurrency(totalExpense)}
              </div>
            </div>
            <TrendingDown className="h-8 w-8 text-red-200 dark:text-red-800" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Net</div>
              <div
                className={`text-xl font-bold ${
                  totalIncome - totalExpense >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(totalIncome - totalExpense)}
              </div>
            </div>
            <ArrowLeftRight className="h-8 w-8 text-blue-200 dark:text-blue-800" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Filter className="h-4 w-4" />
              Filters:
            </div>
            <Select
              options={periodOptions}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-40"
            />
            <Select
              options={[
                { value: "", label: "All Types" },
                ...transactionTypeOptions,
              ]}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-36"
            />
            <Select
              options={[{ value: "", label: "All Accounts" }, ...accountOptions]}
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              className="w-40"
            />
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Receipt}
              title="No transactions found"
              description="Add your first transaction or adjust your filters"
              actionLabel="Add Transaction"
              onAction={openAddModal}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        transaction.type === "income"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : transaction.type === "expense"
                          ? "bg-red-100 dark:bg-red-900/30"
                          : "bg-blue-100 dark:bg-blue-900/30"
                      }`}
                    >
                      {transaction.category?.icon || getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {transaction.description || transaction.category?.name || "Uncategorized"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{transaction.account.name}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.category && (
                          <>
                            <span>•</span>
                            <Badge
                              variant={transaction.type === "income" ? "success" : "danger"}
                              className="text-xs"
                            >
                              {transaction.category.name}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div
                      className={`text-lg font-semibold ${
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : transaction.type === "expense"
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === transaction.id ? null : transaction.id
                          )
                        }
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {openMenuId === transaction.id && (
                        <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                          <button
                            onClick={() => openEditModal(transaction)}
                            className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            {(["expense", "income", "transfer"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategoryId("");
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  type === t
                    ? t === "income"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : t === "expense"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <Input
            id="amount"
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <Input
            id="date"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Select
            id="accountId"
            label="Account"
            options={accountOptions}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Select account"
          />

          {type !== "transfer" && (
            <Select
              id="categoryId"
              label="Category"
              options={categoryOptions}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            />
          )}

          <Input
            id="description"
            label="Description"
            placeholder="e.g., Coffee at Starbucks"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            id="notes"
            label="Notes (optional)"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingTransaction ? "Save Changes" : "Add Transaction"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
