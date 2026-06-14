'use client'

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogTitle,
  Menu, MenuItem as MuiMenuItem, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import toast, { Toaster } from 'react-hot-toast';

import { getAccounts, createAccount, depositToAccount, Account, CreateAccountRequest } from '@/api/accounts';
import { transferMoney, TransferMoneyRequest } from '@/api/transactions';
import { formatCurrency } from '@/lib/utils';

// ── Constants ──────────────────────────────────────────────────────────────

type AccountType = 'SAVINGS' | 'CURRENT' | 'CASH' | 'INVESTMENT';
type Currency    = 'NGN' | 'USD' | 'GBP' | 'EUR';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'SAVINGS',    label: 'Savings'    },
  { value: 'CURRENT',    label: 'Current'    },
  { value: 'CASH',       label: 'Cash'       },
  { value: 'INVESTMENT', label: 'Investment' },
];

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'NGN', label: 'Nigerian Naira',  symbol: '₦' },
  { value: 'USD', label: 'US Dollar',       symbol: '$' },
  { value: 'GBP', label: 'British Pound',   symbol: '£' },
  { value: 'EUR', label: 'Euro',            symbol: '€' },
];

const ACCOUNT_STYLE: Record<AccountType | 'default', { icon: string; bg: string; color: string }> = {
  SAVINGS:    { icon: 'ti-building-bank',      bg: '#E1F5EE', color: '#0F6E56' },
  CURRENT:    { icon: 'ti-credit-card',        bg: '#E6F1FB', color: '#185FA5' },
  CASH:       { icon: 'ti-cash',               bg: '#FAEEDA', color: '#854F0B' },
  INVESTMENT: { icon: 'ti-trending-up',        bg: '#EEEDFE', color: '#3C3489' },
  default:    { icon: 'ti-building-bank',      bg: '#E1F5EE', color: '#0F6E56' },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function AccountIcon({ type }: { type: string }) {
  const s = ACCOUNT_STYLE[type as AccountType] ?? ACCOUNT_STYLE.default;
  return (
    <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, flexShrink: 0 }}
      className="flex items-center justify-center">
      <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: s.color }} aria-hidden="true" />
    </div>
  );
}

function CurrencyBadge({ currency }: { currency: string }) {
  const c = CURRENCIES.find(c => c.value === currency);
  return (
    <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
      {c?.symbol ?? ''} {currency}
    </span>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────

const inputClass  = "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-400 bg-white";
const labelClass  = "block text-xs text-gray-400 mb-1";
const selectClass = `${inputClass} appearance-none`;

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const queryClient = useQueryClient();

  const [showAddModal,      setShowAddModal]      = useState(false);
  const [showDepositModal,  setShowDepositModal]  = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAccount,   setSelectedAccount]   = useState<Account | null>(null);
  const [depositAmount,     setDepositAmount]     = useState('');
  const [anchorEl,          setAnchorEl]          = useState<null | HTMLElement>(null);
  const [menuAccount,       setMenuAccount]       = useState<Account | null>(null);

  const [transferData, setTransferData] = useState<TransferMoneyRequest>({
    from_account: '', to_account: '', amount: '',
  });

  const [newAccount, setNewAccount] = useState<CreateAccountRequest>({
    name: '', type: 'SAVINGS', number: '', amount: 0, currency: 'NGN',
  });

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      invalidate();
      setShowAddModal(false);
      setNewAccount({ name: '', type: 'SAVINGS', number: '', amount: 0, currency: 'NGN' });
      toast.success('Account created!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create account'),
  });

  const depositMutation = useMutation({
    mutationFn: ({ accountId, amount }: { accountId: number; amount: number }) =>
      depositToAccount(accountId, { amount }),
    onSuccess: () => {
      invalidate();
      setShowDepositModal(false);
      setDepositAmount('');
      setSelectedAccount(null);
      toast.success('Money added successfully!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add money'),
  });

  const transferMutation = useMutation({
    mutationFn: transferMoney,
    onSuccess: () => {
      invalidate();
      setShowTransferModal(false);
      setTransferData({ from_account: '', to_account: '', amount: '' });
      toast.success('Transfer completed!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Transfer failed'),
  });

  const openMenu  = (e: React.MouseEvent<HTMLElement>, account: Account) => { setAnchorEl(e.currentTarget); setMenuAccount(account); };
  const closeMenu = () => { setAnchorEl(null); setMenuAccount(null); };

  const handleTransferClick = () => {
    if (menuAccount) {
      setTransferData({ from_account: menuAccount.accountNumber, to_account: '', amount: '' });
      setShowTransferModal(true);
    }
    closeMenu();
  };

  const handleAddMoneyFromMenu = () => {
    if (menuAccount) { setSelectedAccount(menuAccount); setShowDepositModal(true); }
    closeMenu();
  };

  const dialogPaper   = { sx: { borderRadius: '16px', padding: 0, overflow: 'hidden' } };
  const titleSx       = { padding: '24px 28px 16px', borderBottom: '1px solid #f0f0f0' };
  const contentSx     = { padding: '20px 28px 28px' };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-gray-400">Loading accounts…</p>
    </div>
  );

  if (error) return (
    <div className="p-8">
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm text-red-600">Failed to load accounts.</p>
      </div>
    </div>
  );

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your payment methods</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
          <span className="text-base leading-none">+</span> New account
        </button>
      </div>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts?.map((account) => (
          <div key={account.id} className="bg-white rounded-xl border border-gray-100 p-5">

            {/* Card header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <AccountIcon type={account.type} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900">{account.accountName}</p>
                    {account.verified && (
                      <svg className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs font-mono text-gray-400">{account.accountNumber}</p>
                </div>
              </div>
              <button onClick={(e) => openMenu(e, account)} aria-label="Account options"
                className="p-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>

            {/* Type + currency row */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-400 capitalize bg-gray-50 border border-gray-100 rounded px-2 py-0.5">
                {account.type?.charAt(0) + account.type?.slice(1).toLowerCase()}
              </span>
              <CurrencyBadge currency={account.currency ?? 'NGN'} />
            </div>

            <p className="text-xs text-gray-300 mb-4">
              Updated {new Date(account.updatedAt).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>

            {/* Balance + action */}
            <div className="flex items-end justify-between pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Balance</p>
                <p className="text-lg font-medium text-gray-900">
                  {formatCurrency(account.accountBalance, account.currency ?? 'NGN')}
                </p>
              </div>
              <button
                onClick={() => { setSelectedAccount(account); setShowDepositModal(true); }}
                className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors">
                <span>+</span> Add money
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dots menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { borderRadius: '10px', border: '0.5px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', minWidth: 160 } }}>
        <MuiMenuItem onClick={handleTransferClick} sx={{ fontSize: 13, gap: 1.5, py: 1 }}>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Transfer funds
        </MuiMenuItem>
        <MuiMenuItem onClick={handleAddMoneyFromMenu} sx={{ fontSize: 13, gap: 1.5, py: 1 }}>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          Add money
        </MuiMenuItem>
      </Menu>

      {/* ── Add account modal ── */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth PaperProps={dialogPaper}>
        <DialogTitle sx={titleSx}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-900">New account</h2>
            <IconButton onClick={() => setShowAddModal(false)} size="small" sx={{ color: '#9ca3af' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent sx={contentSx}>
          <div className="space-y-4 mt-1">

            {/* Type + Currency side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Account type</label>
                <SelectWrapper>
                  <select value={newAccount.type}
                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as AccountType })}
                    className={selectClass}>
                    {ACCOUNT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </SelectWrapper>
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <SelectWrapper>
                  <select value={newAccount.currency}
                    onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value as Currency })}
                    className={selectClass}>
                    {CURRENCIES.map(c => (
                      <option key={c.value} value={c.value}>{c.symbol} {c.label}</option>
                    ))}
                  </select>
                </SelectWrapper>
              </div>
            </div>

            <div>
              <label className={labelClass}>Account name</label>
              <input className={inputClass} placeholder="e.g. GTBank savings" value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>Account number</label>
              <input className={inputClass} placeholder="0123456789" value={newAccount.number}
                onChange={(e) => setNewAccount({ ...newAccount, number: e.target.value })} />
            </div>

            <div>
              <label className={labelClass}>
                Initial balance ({CURRENCIES.find(c => c.value === newAccount.currency)?.symbol ?? ''})
              </label>
              <input type="number" className={inputClass} placeholder="0.00" value={newAccount.amount || ''}
                onChange={(e) => setNewAccount({ ...newAccount, amount: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={() => setShowAddModal(false)}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => {
                if (!newAccount.name.trim())   return toast.error('Account name is required');
                if (!newAccount.number.trim()) return toast.error('Account number is required');
                createMutation.mutate(newAccount);
              }}
              disabled={createMutation.isPending}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {createMutation.isPending ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Deposit modal ── */}
      <Dialog open={showDepositModal}
        onClose={() => { setShowDepositModal(false); setSelectedAccount(null); setDepositAmount(''); }}
        maxWidth="sm" fullWidth PaperProps={dialogPaper}>
        <DialogTitle sx={titleSx}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-900">Add money</h2>
            <IconButton onClick={() => { setShowDepositModal(false); setSelectedAccount(null); setDepositAmount(''); }}
              size="small" sx={{ color: '#9ca3af' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent sx={contentSx}>
          {selectedAccount && (
            <>
              {/* Account summary pill */}
              <div className="flex items-center justify-between mb-5 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <AccountIcon type={selectedAccount.type} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedAccount.accountName}</p>
                    <p className="text-xs font-mono text-gray-400">{selectedAccount.accountNumber}</p>
                  </div>
                </div>
                <CurrencyBadge currency={selectedAccount.currency ?? 'NGN'} />
              </div>

              <div className="mb-5">
                <label className={labelClass}>
                  Amount ({CURRENCIES.find(c => c.value === (selectedAccount.currency ?? 'NGN'))?.symbol})
                </label>
                <input type="number" autoFocus placeholder="0.00" value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setShowDepositModal(false); setSelectedAccount(null); setDepositAmount(''); }}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!depositAmount || Number(depositAmount) <= 0) return toast.error('Enter a valid amount');
                    depositMutation.mutate({ accountId: selectedAccount.id, amount: parseFloat(depositAmount) });
                  }}
                  disabled={depositMutation.isPending || !depositAmount}
                  className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  {depositMutation.isPending ? 'Processing…' : 'Add money'}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Transfer modal ── */}
      <Dialog open={showTransferModal}
        onClose={() => { setShowTransferModal(false); setTransferData({ from_account: '', to_account: '', amount: '' }); }}
        maxWidth="sm" fullWidth PaperProps={dialogPaper}>
        <DialogTitle sx={titleSx}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-900">Transfer funds</h2>
            <IconButton
              onClick={() => { setShowTransferModal(false); setTransferData({ from_account: '', to_account: '', amount: '' }); }}
              size="small" sx={{ color: '#9ca3af' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent sx={contentSx}>
          <div className="space-y-4 mt-1">
            <div>
              <label className={labelClass}>From account</label>
              <SelectWrapper>
                <select value={transferData.from_account}
                  onChange={(e) => setTransferData({ ...transferData, from_account: e.target.value })}
                  className={selectClass}>
                  <option value="" disabled>Select account</option>
                  {accounts?.map((a) => (
                    <option key={a.id} value={a.accountNumber}>
                      {a.accountName} — {a.accountNumber}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            </div>

            <div>
              <label className={labelClass}>To account</label>
              <SelectWrapper>
                <select value={transferData.to_account}
                  onChange={(e) => setTransferData({ ...transferData, to_account: e.target.value })}
                  className={selectClass}>
                  <option value="" disabled>Select account</option>
                  {accounts
                    ?.filter((a) => a.accountNumber !== transferData.from_account)
                    .map((a) => (
                      <option key={a.id} value={a.accountNumber}>
                        {a.accountName} — {a.accountNumber}
                      </option>
                    ))}
                </select>
              </SelectWrapper>
            </div>

            {/* Show currency mismatch warning */}
            {transferData.from_account && transferData.to_account && (() => {
              const from = accounts?.find(a => a.accountNumber === transferData.from_account);
              const to   = accounts?.find(a => a.accountNumber === transferData.to_account);
              if (from && to && from.currency !== to.currency) {
                return (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    These accounts use different currencies ({from.currency} → {to.currency}). Confirm this is intended.
                  </p>
                );
              }
            })()}

            <div>
              <label className={labelClass}>Amount</label>
              <input type="number" placeholder="0.00" value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => { setShowTransferModal(false); setTransferData({ from_account: '', to_account: '', amount: '' }); }}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => {
                if (!transferData.from_account) return toast.error('Select a source account');
                if (!transferData.to_account)   return toast.error('Select a destination account');
                if (!transferData.amount || Number(transferData.amount) <= 0) return toast.error('Enter a valid amount');
                transferMutation.mutate(transferData);
              }}
              disabled={transferMutation.isPending || !transferData.from_account || !transferData.to_account || !transferData.amount}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {transferMutation.isPending ? 'Transferring…' : 'Transfer'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}