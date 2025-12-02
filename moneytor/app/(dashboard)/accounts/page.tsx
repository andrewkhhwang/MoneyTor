"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
  Banknote,
} from "lucide-react";
import { formatCurrency, getAccountTypeLabel, isAssetAccount } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  startingBalance: number;
  currentBalance: number | null;
  calculatedBalance: number;
  isSyncEnabled: boolean;
  institution?: { name: string } | null;
  _count: { transactions: number };
}

const accountTypes = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit_card", label: "Credit Card" },
  { value: "investment", label: "Investment" },
  { value: "loan", label: "Loan" },
  { value: "mortgage", label: "Mortgage" },
  { value: "manual_cash", label: "Cash" },
];

const accountIcons: Record<string, React.ReactNode> = {
  checking: <Wallet className="h-5 w-5" />,
  savings: <PiggyBank className="h-5 w-5" />,
  credit_card: <CreditCard className="h-5 w-5" />,
  investment: <TrendingUp className="h-5 w-5" />,
  loan: <Building2 className="h-5 w-5" />,
  mortgage: <Building2 className="h-5 w-5" />,
  manual_cash: <Banknote className="h-5 w-5" />,
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [startingBalance, setStartingBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAccount(null);
    setName("");
    setType("checking");
    setStartingBalance("");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type);
    setStartingBalance(account.startingBalance.toString());
    setError("");
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url = editingAccount
        ? `/api/accounts/${editingAccount.id}`
        : "/api/accounts";
      const method = editingAccount ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          startingBalance: parseFloat(startingBalance) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save account");
        return;
      }

      setIsModalOpen(false);
      fetchAccounts();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account? All associated transactions will also be deleted.")) {
      return;
    }

    try {
      const response = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchAccounts();
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
    setOpenMenuId(null);
  };

  const totalAssets = accounts
    .filter((a) => isAssetAccount(a.type))
    .reduce((sum, a) => sum + a.calculatedBalance, 0);

  const totalLiabilities = accounts
    .filter((a) => !isAssetAccount(a.type))
    .reduce((sum, a) => sum + Math.abs(a.calculatedBalance), 0);

  const netWorth = totalAssets - totalLiabilities;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />
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
            Accounts
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your bank accounts and track balances
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Assets
            </div>
            <div className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalAssets)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Liabilities
            </div>
            <div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalLiabilities)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Net Worth
            </div>
            <div
              className={`mt-1 text-2xl font-bold ${
                netWorth >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(netWorth)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Wallet}
              title="No accounts yet"
              description="Add your first account to start tracking your finances"
              actionLabel="Add Account"
              onAction={openAddModal}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="relative">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isAssetAccount(account.type)
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {accountIcons[account.type] || <Wallet className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{account.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={isAssetAccount(account.type) ? "success" : "danger"}>
                        {getAccountTypeLabel(account.type)}
                      </Badge>
                      {account.institution && (
                        <span className="text-xs text-gray-500">
                          {account.institution.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === account.id ? null : account.id)
                    }
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {openMenuId === account.id && (
                    <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <button
                        onClick={() => openEditModal(account)}
                        className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(account.calculatedBalance, account.currency)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {account._count.transactions} transactions
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? "Edit Account" : "Add Account"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <Input
            id="name"
            label="Account Name"
            placeholder="e.g., Main Checking"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            id="type"
            label="Account Type"
            options={accountTypes}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />

          <Input
            id="startingBalance"
            label="Starting Balance"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
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
              {editingAccount ? "Save Changes" : "Add Account"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
