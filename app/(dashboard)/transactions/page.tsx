"use client";

import React, { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import toast, { Toaster } from 'react-hot-toast';
import http from "@/lib/http";

import {
  getTransactions,
  addTransaction,
  Transaction,
  AddTransactionRequest,
  ApiResponse,
  PaginatedTransactions,
} from '@/services/transactions';
import { getAccounts, Account } from '@/services/accounts';

interface LineItem {
  name: string; quantity: number; unit_price: number; amount: number; category: string;
}
interface ReceiptData {
  merchant: string; date: string | null; time: string | null; currency: string;
  payment_method: string | null; category: string; line_items: LineItem[];
  totals: { subtotal: number; tax: number; discount: number; total: number };
  expense_categories: { category: string; amount: number }[];
  notes: string | null;
}

const CATEGORY_MAP: Record<string, string> = {
  "dairy & eggs": "FOOD", produce: "FOOD", meat: "FOOD", snacks: "FOOD",
  "canned goods": "FOOD", groceries: "FOOD", food: "FOOD", dining: "FOOD",
  restaurant: "FOOD", transport: "TRANSPORT", travel: "TRANSPORT",
  shopping: "SHOPPING", retail: "SHOPPING", clothing: "SHOPPING",
  household: "BILLS", utilities: "BILLS", bills: "BILLS",
  entertainment: "ENTERTAINMENT", health: "HEALTH", pharmacy: "HEALTH",
  medical: "HEALTH", education: "EDUCATION", salary: "SALARY",
  investment: "INVESTMENT", transfer: "TRANSFER",
};

const CATEGORY_STYLES: Record<string, string> = {
  FOOD: "bg-teal-50 text-teal-700", TRANSPORT: "bg-amber-50 text-amber-700",
  SHOPPING: "bg-pink-50 text-pink-700", BILLS: "bg-orange-50 text-orange-700",
  ENTERTAINMENT: "bg-purple-50 text-purple-700", HEALTH: "bg-red-50 text-red-700",
  EDUCATION: "bg-blue-50 text-blue-700", SALARY: "bg-blue-50 text-blue-700",
  INVESTMENT: "bg-green-50 text-green-700", TRANSFER: "bg-gray-100 text-gray-600",
  OTHER: "bg-gray-100 text-gray-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Food", TRANSPORT: "Transport", SHOPPING: "Shopping", BILLS: "Bills",
  ENTERTAINMENT: "Entertainment", HEALTH: "Health", EDUCATION: "Education",
  SALARY: "Salary", INVESTMENT: "Investment", TRANSFER: "Transfer", OTHER: "Other",
};

const dialogSlotProps = {
  paper: {
    sx: {
      borderRadius: "16px",
      padding: 0,
      overflow: "hidden",
      margin: "16px",
      width: "calc(100% - 32px)",
      maxWidth: "480px",
      // Always center on all screen sizes
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    },
  },
};

const inputClass  = "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-400 placeholder:text-gray-400";
const selectClass = "w-full appearance-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-400 bg-white";
const labelClass  = "block text-xs font-medium text-gray-500 mb-1";

function mapCategory(raw: string): string {
  const key = (raw || "").toLowerCase().trim();
  for (const [pattern, mapped] of Object.entries(CATEGORY_MAP)) {
    if (key.includes(pattern)) return mapped;
  }
  return "OTHER";
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function SelectChevron() {
  return (
    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
      fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function TransactionsActivity() {
  const queryClient = useQueryClient();
  const [startDate,    setStartDate]    = useState("");
  const [endDate,      setEndDate]      = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [page,         setPage]         = useState(1);
  const [limit,        setLimit]        = useState(10);

  const { data: transactionsData, isLoading } = useQuery<ApiResponse<PaginatedTransactions>>({
    queryKey: ['transactions', searchQuery, page, limit],
    queryFn: () => getTransactions({ s: searchQuery || undefined, page, limit }),
    placeholderData: (prev) => prev,
  });

  const { data: accountsData } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const accounts: Account[]         = accountsData ?? [];
  const transactions: Transaction[] = transactionsData?.data?.data ?? [];
  const total                       = transactionsData?.data?.total ?? 0;

  const addTransactionMutation = useMutation({
    mutationFn: ({ accountId, data }: { accountId: number; data: AddTransactionRequest }) =>
      addTransaction(accountId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowPayModal(false);
      toast.success('Transaction added successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Transaction failed');
    },
  });

  const debouncedSearch = useMemo(
    () => debounce((value: string) => { setPage(1); setSearchQuery(value); }, 500),
    []
  );

  const filteredTransactions = useMemo(() => {
    if (!startDate || !endDate) return transactions;
    const start = new Date(startDate);
    const end   = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return transactions.filter((t) => {
      const d = new Date(t.createdAt);
      return d >= start && d <= end;
    });
  }, [transactions, startDate, endDate]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });

  const formatAmount = (amount: string, type: string) =>
    `${type === "income" ? "+" : "−"}₦${parseFloat(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900 truncate block max-w-[200px]">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const cat   = row.original.category as string;
        const style = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.OTHER;
        const label = CATEGORY_LABELS[cat] ?? cat;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <span className="text-sm text-gray-500 capitalize">{row.original.source}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: () => <span className="block text-right">Amount</span>,
      cell: ({ row }) => (
        <span className={`block text-right text-sm font-semibold ${
          row.original.type === "income" ? "text-teal-600" : "text-gray-900"
        }`}>
          {formatAmount(row.original.amount, row.original.type)}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg sm:text-xl font-medium text-gray-900">Transactions activity</h1>
        <button
          onClick={() => setShowPayModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          <span className="hidden xs:inline">New transaction</span>
          <span className="xs:hidden">New</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">

        {/* Date range — stacks nicely on mobile */}
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 w-full sm:w-auto">
          <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-gray-400">From</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="border-0 outline-none text-gray-700 bg-transparent text-sm w-32" />
          <span className="text-gray-300">→</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="border-0 outline-none text-gray-700 bg-transparent text-sm w-32" />
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search transactions…"
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-gray-400 placeholder:text-gray-400"
          />
        </div>

        {/* Export */}
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={filteredTransactions}
        columns={columns}
        loading={isLoading}
        pagination={{
          page, limit, total,
          onPageChange: setPage,
          onLimitChange: (n) => { setLimit(n); setPage(1); },
        }}
      />

      <PaymentDialog
        open={showPayModal}
        onClose={() => setShowPayModal(false)}
        accounts={accounts}
        onSubmit={(accountId, data) => addTransactionMutation.mutate({ accountId, data })}
        isSubmitting={addTransactionMutation.isPending}
      />
    </div>
  );
}

// ── Payment Dialog ─────────────────────────────────────────────────────────

interface PaymentDialogProps {
  open: boolean; onClose: () => void; accounts: Account[];
  onSubmit: (accountId: number, data: AddTransactionRequest) => void;
  isSubmitting: boolean;
}

function PaymentDialog({ open, onClose, onSubmit, isSubmitting, accounts }: PaymentDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning,     setIsScanning]     = useState(false);
  const [scannedReceipt, setScannedReceipt] = useState<ReceiptData | null>(null);

  const defaultForm = {
    type: "expense", amount: "", accountId: "",
    category: "", date: new Date().toISOString().split("T")[0], description: "",
  };
  const [formData, setFormData] = useState(defaultForm);

  React.useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData((prev) => ({ ...prev, accountId: String(accounts[0].id) }));
    }
  }, [accounts]);

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const toastId = toast.loading("Scanning receipt with AI…");
    try {
      const form = new FormData();
      form.append("receipt", file);
      const { data } = await http.post<ReceiptData>(
        "transactions/scan-receipt", form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setScannedReceipt(data);
      setFormData((prev) => ({
        ...prev,
        amount:      data.totals?.total?.toString() ?? prev.amount,
        description: data.merchant
          ? `${data.merchant}${data.notes ? ` — ${data.notes.slice(0, 60)}` : ""}`
          : prev.description,
        category: mapCategory(data.category ?? ""),
        date:     data.date ? new Date(data.date).toISOString().split("T")[0] : prev.date,
        type: "expense",
      }));
      toast.success("Receipt scanned successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to scan receipt", { id: toastId });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    setFormData({ ...defaultForm, accountId: accounts.length > 0 ? String(accounts[0].id) : "" });
    setScannedReceipt(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId) { toast.error("Please select an account"); return; }
    const selectedAccount = accounts.find((acc) => acc.id === Number(formData.accountId));
    onSubmit(Number(formData.accountId), {
      amount: formData.amount, description: formData.description,
      source: selectedAccount?.accountName ?? "unknown",
      category: formData.category || "OTHER",
    });
    handleReset();
  };

  const formatDisplayDate = (dateStr: string) =>
    dateStr
      ? new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
          month: "long", day: "numeric", year: "numeric",
        })
      : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={dialogSlotProps}
      // Ensure it's always centred, not bottom-sheet on mobile
      sx={{ '& .MuiDialog-container': { alignItems: 'center' } }}
    >
      <DialogTitle sx={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">Add transaction</h2>
          <IconButton onClick={onClose} size="small" sx={{ color: "#9ca3af" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent sx={{ padding: "20px 24px 24px", overflowY: "auto", maxHeight: "calc(100vh - 140px)" }}>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Scan receipt */}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden" onChange={handleScanReceipt} />
          <button
            type="button" disabled={isScanning}
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-60 transition-opacity"
            style={{ background: "linear-gradient(to right, #f97316, #ec4899, #a855f7)" }}
          >
            {isScanning ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Scanning…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scan receipt with AI
              </>
            )}
          </button>

          {/* Scanned receipt pill */}
          {scannedReceipt && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-800">
                  {scannedReceipt.merchant} — {scannedReceipt.currency}{scannedReceipt.totals?.total?.toFixed(2)}
                </p>
                <p className="text-xs text-green-700 mt-0.5 truncate">
                  {scannedReceipt.line_items?.length} items · {scannedReceipt.category}
                  {scannedReceipt.date ? ` · ${scannedReceipt.date}` : ""}
                </p>
              </div>
              <button type="button" onClick={handleReset} className="text-green-500 hover:text-green-700 text-xs shrink-0">
                clear
              </button>
            </div>
          )}

          {/* Type */}
          <div>
            <label className={labelClass}>Type</label>
            <div className="relative">
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className={selectClass}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
              <SelectChevron />
            </div>
          </div>

          {/* Amount + Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Amount</label>
              <input type="number" required placeholder="0.00" value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Account</label>
              <div className="relative">
                <select required value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })} className={selectClass}>
                  <option value="" disabled>Select account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} — ₦{Number(acc.accountBalance).toLocaleString()}
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category</label>
            <div className="relative">
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={selectClass}>
                <option value="">Select category</option>
                <option value="FOOD">Food & Dining</option>
                <option value="TRANSPORT">Transport</option>
                <option value="SHOPPING">Shopping</option>
                <option value="BILLS">Bills & Utilities</option>
                <option value="ENTERTAINMENT">Entertainment</option>
                <option value="HEALTH">Health</option>
                <option value="EDUCATION">Education</option>
                <option value="SALARY">Salary</option>
                <option value="INVESTMENT">Investment</option>
                <option value="TRANSFER">Transfer</option>
                <option value="OTHER">Other</option>
              </select>
              <SelectChevron />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className={labelClass}>Date</label>
            <div className="relative">
              <div className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 flex items-center justify-between pointer-events-none">
                <span>{formData.date ? formatDisplayDate(formData.date) : "Select date"}</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input type="date" value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <input type="text" placeholder="Enter description" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClass} />
          </div>

          {/* Footer */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? "Processing…" : "Create transaction"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}