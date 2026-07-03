"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { dashboardInformation } from '@/services/dashboard';
import { getBudget, upsertBudget } from '@/services/budget';
import { getAccounts } from '@/services/accounts';
import Loader from '@/components/ui/loader';

// ── Types ──────────────────────────────────────────────────────────────────

interface ChartDataPoint { label: string; income: number; expense: number; }
interface Transaction {
  id: number; userId: number; accountId: number; description: string;
  status: string; source: string; amount: string; type: 'income' | 'expense';
  createdAt: string; updatedAt: string;
}
interface Account {
  id: number; userId: number; accountName: string; accountNumber: string;
  accountBalance: string; createdAt: string; updatedAt: string;
}
interface DashboardData {
  availableBalance: number; totalIncome: number; totalExpense: number;
  chartData: ChartDataPoint[]; lastTransactions: Transaction[]; lastAccount: Account[];
  user?: { firstName?: string };
}
interface BudgetData {
  id: number; userId: number; name: string | null; amount: number; spent: number;
  percentageSpent: number; remaining: number; createdAt: string; updatedAt: string;
}

// ── Currency typography helper ─────────────────────────────────────────────
//
// Usage:
//   <CurrencyText amount={1234567.89} />                    → ₦1,234,567.89
//   <CurrencyText amount={50000} size="lg" />               → larger style
//   <CurrencyText amount={income} sign="+" color="green" /> → +₦...
//   <CurrencyText amount={0} decimals={0} />                → ₦0
//
// The symbol is rendered slightly smaller than the number so they read cleanly
// at every size without extra layout work.

type CurrencySize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
type CurrencyColor = 'default' | 'green' | 'red' | 'muted';

interface CurrencyTextProps {
  amount: number;
  currency?: string;
  size?: CurrencySize;
  color?: CurrencyColor;
  sign?: '+' | '−' | 'auto' | 'none';
  decimals?: number;
  className?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦', USD: '$', GBP: '£', EUR: '€',
};

const SIZE_MAP: Record<CurrencySize, { symbol: string; number: string; sign: string }> = {
  xs:   { symbol: 'text-[10px]', number: 'text-xs',   sign: 'text-[10px]' },
  sm:   { symbol: 'text-xs',     number: 'text-sm',   sign: 'text-xs'     },
  base: { symbol: 'text-sm',     number: 'text-base', sign: 'text-sm'     },
  lg:   { symbol: 'text-base',   number: 'text-lg',   sign: 'text-base'   },
  xl:   { symbol: 'text-lg',     number: 'text-xl',   sign: 'text-lg'     },
  '2xl':{ symbol: 'text-xl',     number: 'text-2xl',  sign: 'text-xl'     },
  '3xl':{ symbol: 'text-2xl',    number: 'text-3xl',  sign: 'text-2xl'    },
};

const COLOR_MAP: Record<CurrencyColor, string> = {
  default: 'text-gray-900',
  green:   'text-teal-600',
  red:     'text-red-500',
  muted:   'text-gray-500',
};

function CurrencyText({
  amount,
  currency = 'NGN',
  size = 'base',
  color = 'default',
  sign = 'none',
  decimals = 2,
  className = '',
}: CurrencyTextProps) {
  const symbol     = CURRENCY_SYMBOLS[currency] ?? currency;
  const sizes      = SIZE_MAP[size];
  const colorClass = COLOR_MAP[color];

  const absAmount  = Math.abs(amount);
  const formatted  = absAmount.toLocaleString('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // Split on decimal so we can de-emphasise the cents
  const [whole, cents] = formatted.split('.');

  let signChar = '';
  if (sign === 'auto') signChar = amount >= 0 ? '+' : '−';
  else if (sign === '+') signChar = '+';
  else if (sign === '−') signChar = '−';

  return (
    <span className={`inline-flex items-baseline gap-[1px] font-semibold tabular-nums ${colorClass} ${className}`}>
      {signChar && (
        <span className={`${sizes.sign} font-medium leading-none`}>{signChar}</span>
      )}
      <span className={`${sizes.symbol} font-medium leading-none opacity-70`}>{symbol}</span>
      <span className={`${sizes.number} leading-none`}>{whole}</span>
      {decimals > 0 && cents !== undefined && (
        <span className={`${sizes.symbol} leading-none opacity-60`}>.{cents}</span>
      )}
    </span>
  );
}

// ── Donut chart ────────────────────────────────────────────────────────────

function DonutChart({ income, expense }: { income: number; expense: number }) {
  const total = income + expense;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <svg viewBox="0 0 120 120" className="w-28 h-28 opacity-15">
          <circle cx="60" cy="60" r="48" fill="none" stroke="#d1d5db" strokeWidth="18" />
        </svg>
        <p className="text-xs text-gray-400">No transactions yet</p>
      </div>
    );
  }

  const r             = 48;
  const cx            = 60;
  const cy            = 60;
  const circumference = 2 * Math.PI * r;
  const incomeArc     = circumference * (income / total);
  const expenseArc    = circumference * (expense / total);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5">
      {/* Donut */}
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 120 120" className="w-32 h-32 sm:w-36 sm:h-36 -rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="18" />
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="#1D9E75" strokeWidth="18"
            strokeDasharray={`${incomeArc} ${circumference - incomeArc}`}
            strokeDashoffset={0} strokeLinecap="butt"
          />
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="#E24B4A" strokeWidth="18"
            strokeDasharray={`${expenseArc} ${circumference - expenseArc}`}
            strokeDashoffset={-incomeArc} strokeLinecap="butt"
          />
        </svg>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <p className="text-[10px] font-medium text-gray-400 leading-none">Total</p>
          <CurrencyText
            amount={total}
            size="sm"
            decimals={0}
            className="!text-gray-900 !font-bold"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2.5 px-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1D9E75] flex-shrink-0" />
            Income
          </span>
          <CurrencyText amount={income} size="sm" color="green" />
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E24B4A] flex-shrink-0" />
            Expense
          </span>
          <CurrencyText amount={expense} size="sm" color="red" />
        </div>
        <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">Net balance</span>
          <CurrencyText
            amount={Math.abs(income - expense)}
            size="sm"
            color={income >= expense ? 'green' : 'red'}
            sign={income >= expense ? '+' : '−'}
          />
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────

const card = "bg-white rounded-xl border border-gray-200 p-4 sm:p-5";
const sectionLabel = "text-sm font-semibold text-gray-800";
const metaText = "text-xs text-gray-500";

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardBody() {
  const queryClient = useQueryClient();
  const router      = useRouter();

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetAmount,    setBudgetAmount]    = useState('');
  const [budgetName,      setBudgetName]      = useState('');

  const { data, isLoading, error } = useQuery<{ data: DashboardData }>({
    queryKey: ['dashboard'],
    queryFn:  dashboardInformation,
  });

  const { data: budgetData, isLoading: budgetLoading } = useQuery<{ data: BudgetData }>({
    queryKey: ['budget'],
    queryFn:  getBudget,
    retry:    false,
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn:  getAccounts,
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ name, amount }: { name: string; amount: number }) =>
      upsertBudget(name, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      setShowBudgetModal(false);
      setBudgetAmount('');
      setBudgetName('');
    },
  });

  const dashboardData = data?.data;
  const budget        = budgetData?.data;
  const accountCount  = (accountsData as any[])?.length ?? 0;
  const hasAccounts   = accountCount > 0;
  const firstName     = dashboardData?.user?.firstName ?? 'there';

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(budgetAmount);
    if (amount > 0) updateBudgetMutation.mutate({ name: budgetName || 'Monthly budget', amount });
  };

  const handleEditBudget = () => {
    if (budget) { setBudgetName(budget.name || ''); setBudgetAmount(budget.amount.toString()); }
    setShowBudgetModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">Failed to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const budgetPct = budget ? Math.min((budget.spent / budget.amount) * 100, 100) : 0;

  const barColor =
    budgetPct >= 100 ? 'bg-red-500' :
    budgetPct >= 80  ? 'bg-amber-500' :
    'bg-teal-500';

  const budgetBadge =
    budgetPct >= 100 ? (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
        Over budget
      </span>
    ) : budgetPct >= 80 ? (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
        Nearing limit
      </span>
    ) : null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto space-y-4 sm:space-y-5">

      {/* ── Welcome ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
            {greeting}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your finances today.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <span className={`${metaText} font-medium`}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── Account shortcut (no accounts) ── */}
      {!hasAccounts && (
        <div className="bg-gray-900 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Set up your first account</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Add a bank account or cash wallet to start tracking.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/accounts')}
            className="flex-shrink-0 flex items-center gap-2 bg-white text-gray-900 text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Add account
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Account shortcut (has accounts) ── */}
      {hasAccounts && (
        <button
          onClick={() => router.push('/accounts')}
          className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex items-center justify-between hover:border-gray-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {accountCount} account{accountCount !== 1 ? 's' : ''} connected
              </p>
              <span className="inline-flex items-baseline gap-0.5 mt-0.5">
                <span className={metaText}>Total balance: </span>
                <CurrencyText amount={dashboardData.availableBalance} size="xs" color="muted" />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-gray-600 transition-colors">
            <span className="hidden sm:inline text-xs font-medium">Manage</span>
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      )}

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Available balance',
            amount: dashboardData.availableBalance,
            iconBg: 'bg-gray-100', iconColor: 'text-gray-600',
            amountColor: 'default' as CurrencyColor,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
          },
          {
            label: 'Total income',
            amount: dashboardData.totalIncome,
            iconBg: 'bg-teal-50', iconColor: 'text-teal-600',
            amountColor: 'green' as CurrencyColor,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 17l9.2-9.2M17 17V7H7" />,
          },
          {
            label: 'Total expense',
            amount: dashboardData.totalExpense,
            iconBg: 'bg-red-50', iconColor: 'text-red-500',
            amountColor: 'red' as CurrencyColor,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 7l-9.2 9.2M7 7v10h10" />,
          },
        ].map(({ label, amount, iconBg, iconColor, amountColor, icon }) => (
          <div key={label} className={card}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <svg className={`w-4 h-4 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {icon}
                </svg>
              </div>
              <div className="min-w-0">
                <p className={`${metaText} mb-0.5 truncate`}>{label}</p>
                <CurrencyText amount={amount} size="xl" color={amountColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Budget tracker ── */}
      <div className={card}>
        <div className="flex items-center justify-between mb-4">
          <p className={sectionLabel}>{budget?.name || 'Monthly budget'}</p>
          {budget ? (
            <button onClick={handleEditBudget}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors">
              Edit
            </button>
          ) : (
            <button onClick={() => setShowBudgetModal(true)}
              className="text-xs font-semibold text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              Set budget
            </button>
          )}
        </div>

        {budgetLoading ? (
          <p className="text-sm text-gray-500 py-4 text-center">Loading…</p>
        ) : budget ? (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              {[
                { label: 'Budget',    amount: budget.amount,    color: 'default' as CurrencyColor },
                { label: 'Spent',     amount: budget.spent,     color: 'red'     as CurrencyColor },
                { label: 'Remaining', amount: budget.remaining, color: 'green'   as CurrencyColor },
              ].map(({ label, amount, color }) => (
                <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                  <p className={`${metaText} mb-1`}>{label}</p>
                  <CurrencyText amount={amount} size="lg" color={color} />
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className={`${metaText} font-medium`}>{budgetPct.toFixed(1)}% used</p>
              {budgetBadge}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-3">No budget set yet</p>
            <button onClick={() => setShowBudgetModal(true)}
              className="text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
              Create a budget
            </button>
          </div>
        )}
      </div>

      {/* ── Donut + recent transactions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Donut */}
        <div className={`${card} lg:col-span-1`}>
          <p className={`${sectionLabel} mb-4`}>Income vs Expense</p>
          <div className="h-64 sm:h-72">
            <DonutChart
              income={dashboardData.totalIncome}
              expense={dashboardData.totalExpense}
            />
          </div>
        </div>

        {/* Recent transactions */}
        <div className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <p className={sectionLabel}>Recent transactions</p>
            <button
              onClick={() => router.push('/transactions')}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors group"
            >
              View all
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-1">
            {dashboardData.lastTransactions.slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    t.type === 'income' ? 'bg-teal-50' : 'bg-red-50'
                  }`}>
                    {t.type === 'income' ? (
                      <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                      {t.source}
                    </p>
                    <p className={`${metaText} truncate leading-tight mt-0.5`}>
                      {t.description || new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <CurrencyText
                    amount={Number(t.amount)}
                    size="sm"
                    color={t.type === 'income' ? 'green' : 'red'}
                    sign={t.type === 'income' ? '+' : '−'}
                  />
                  <p className={`${metaText} mt-0.5`}>
                    {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}

            {dashboardData.lastTransactions.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-gray-500">No transactions yet</p>
              </div>
            )}
          </div>

          {dashboardData.lastTransactions.length > 0 && (
            <button
              onClick={() => router.push('/transactions')}
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors group pt-3 border-t border-gray-100"
            >
              See all transactions
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Budget modal ── */}
      {showBudgetModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowBudgetModal(false); }}
        >
          <div className="bg-white rounded-2xl p-6 sm:p-7 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              {budget ? 'Update budget' : 'Set a budget'}
            </h2>
            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Budget name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="e.g. Monthly budget"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowBudgetModal(false); setBudgetAmount(''); setBudgetName(''); }}
                  className="px-4 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateBudgetMutation.isPending}
                  className="px-4 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {updateBudgetMutation.isPending ? 'Saving…' : budget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}