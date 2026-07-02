// @/api/transactions.ts

import http from '@/lib/http';

export interface Transaction {
  id: number;
  userId: number;
  accountId: number;
  description: string;
  status: string;
  source: string;
  amount: string;
  category: string;
  type: 'income' | 'expense';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionParams {
  s?: string;
  page?: number;
  limit?: number;
}

export interface AddTransactionRequest {
  amount: string;
  description: string;
  source: string;
  category : string
}

export interface TransferMoneyRequest {
  from_account: string;
  to_account: string;
  amount: string;
}

// Fetch all transactions
export const getTransactions = async (
  params?: TransactionParams
): Promise<ApiResponse<PaginatedTransactions>> => {
  const response = await http.get('/transactions', { params });
  return response.data;
};

// Add transaction
export const addTransaction = async (
  accountId: number,
  data: AddTransactionRequest
): Promise<ApiResponse> => {
  const response = await http.post(
    `/transactions/add-transaction/${accountId}`,
    data
  );

  return response.data;
};

// Transfer money
export const transferMoney = async (
  data: TransferMoneyRequest
): Promise<ApiResponse> => {
  const response = await http.post(
    '/transactions/transfer-money',
    data
  );

  return response.data;
};