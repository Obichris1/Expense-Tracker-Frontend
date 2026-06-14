"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardInformation } from '@/api/dashboard';
import { getBudget, upsertBudget } from '@/api/budget';

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
}
interface BudgetData {
  id: number; userId: number; name: string | null; amount: number; spent: number;
  percentageSpent: number; remaining: number; createdAt: string; updatedAt: string;
}

function fmt(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

export default function DashboardBody() {
  const queryClient = useQueryClient();
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetName, setBudgetName] = useState('');

  const { data, isLoading, error } = useQuery<{ data: DashboardData }>({
    queryKey: ['dashboard'],
    queryFn: dashboardInformation,
  });

  const { data: budgetData, isLoading: budgetLoading } = useQuery<{ data: BudgetData }>({
    queryKey: ['budget'],
    queryFn: getBudget,
    retry: false,
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ name, amount }: { name: string; amount: number }) => upsertBudget(name, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      setShowBudgetModal(false);
      setBudgetAmount('');
      setBudgetName('');
    },
  });

  const dashboardData = data?.data;
  const budget = budgetData?.data;

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
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">Failed to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...dashboardData.chartData.map(d => Math.max(d.income, d.expense)), 1);
  const budgetPct = budget ? Math.min((budget.spent / budget.amount) * 100, 100) : 0;

  const barColor =
    budgetPct >= 100 ? 'bg-red-500' :
    budgetPct >= 80  ? 'bg-amber-500' :
    'bg-teal-500';

  const badgeEl =
    budgetPct >= 100 ? (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">Over budget</span>
    ) : budgetPct >= 80 ? (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Nearing limit</span>
    ) : null;

  const cardClass = "bg-white rounded-xl border border-gray-100 p-5";
  const labelClass = "text-xs text-gray-400 mb-0.5";

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Monitor your financial activity</p>
      </div>

      {/* Budget tracker — full width, above metrics */}
      <div className={`${cardClass} mb-5`}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-900">
            {budget?.name || 'Monthly budget'}
          </p>
          {budget ? (
            <button onClick={handleEditBudget} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Edit
            </button>
          ) : (
            <button onClick={() => setShowBudgetModal(true)}
              className="text-xs font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-1 hover:bg-gray-50 transition-colors">
              Set budget
            </button>
          )}
        </div>

        {budgetLoading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
        ) : budget ? (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                <p className={labelClass}>Budget</p>
                <p className="text-sm font-medium text-gray-900">₦{fmt(budget.amount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                <p className={labelClass}>Spent</p>
                <p className="text-sm font-medium text-red-600">₦{fmt(budget.spent)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                <p className={labelClass}>Remaining</p>
                <p className="text-sm font-medium text-teal-600">₦{fmt(budget.remaining)}</p>
              </div>
            </div>

            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${budgetPct}%` }} />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">{budgetPct.toFixed(1)}% used</p>
              {badgeEl}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 mb-3">No budget set yet</p>
            <button onClick={() => setShowBudgetModal(true)}
              className="text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
              Create a budget
            </button>
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className={cardClass}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className={labelClass}>Available balance</p>
              <p className="text-base font-medium text-gray-900">₦{fmt(dashboardData.availableBalance)}</p>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </div>
            <div>
              <p className={labelClass}>Total income</p>
              <p className="text-base font-medium text-teal-600">₦{fmt(dashboardData.totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 7l-9.2 9.2M7 7v10h10" />
              </svg>
            </div>
            <div>
              <p className={labelClass}>Total expense</p>
              <p className="text-base font-medium text-red-500">₦{fmt(dashboardData.totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + recent transactions */}
      <div className="grid grid-cols-3 gap-4">

        {/* Chart */}
        <div className={`col-span-2 ${cardClass}`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-900">Transaction activity</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-5 h-0.5 bg-teal-500 rounded inline-block" />
                Income
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-5 h-0.5 bg-red-400 rounded inline-block" />
                Expense
              </span>
            </div>
          </div>

          <div className="h-52">
            <svg viewBox="0 0 560 200" className="w-full h-full">
              {[10, 55, 100, 145, 175].map(y => (
                <line key={y} x1="40" y1={y} x2="550" y2={y} stroke="#f3f4f6" strokeWidth="1" />
              ))}

              <polyline
                points={dashboardData.chartData.map((d, i) => {
                  const x = 50 + i * (500 / Math.max(dashboardData.chartData.length - 1, 1));
                  const y = 175 - (d.income / maxValue) * 155;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none" stroke="#1D9E75" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              />

              <polyline
                points={dashboardData.chartData.map((d, i) => {
                  const x = 50 + i * (500 / Math.max(dashboardData.chartData.length - 1, 1));
                  const y = 175 - (d.expense / maxValue) * 155;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none" stroke="#E24B4A" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              />

              {dashboardData.chartData.map((d, i) => (
                <text key={d.label}
                  x={50 + i * (500 / Math.max(dashboardData.chartData.length - 1, 1))}
                  y="195" fontSize="10" fill="#9ca3af" textAnchor="middle">
                  {d.label}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Recent transactions */}
        <div className={cardClass}>
          <p className="text-sm font-medium text-gray-900 mb-4">Recent transactions</p>
          <div className="flex flex-col gap-3">
            {dashboardData.lastTransactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
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
                    <p className="text-xs font-medium text-gray-900 truncate">{t.source}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <p className={`text-xs font-medium flex-shrink-0 ${
                  t.type === 'income' ? 'text-teal-600' : 'text-red-500'
                }`}>
                  {t.type === 'income' ? '+' : '−'}₦{Number(t.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-7 max-w-sm w-full mx-4">
            <h2 className="text-base font-medium text-gray-900 mb-5">
              {budget ? 'Update budget' : 'Set a budget'}
            </h2>
            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Budget name (optional)</label>
                <input type="text" value={budgetName} onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="e.g. Monthly budget"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Amount (₦)</label>
                <input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="0.00" step="0.01" min="0" required
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button type="button" onClick={() => { setShowBudgetModal(false); setBudgetAmount(''); setBudgetName(''); }}
                  className="px-4 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={updateBudgetMutation.isPending}
                  className="px-4 py-2.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
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