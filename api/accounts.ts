// Account API Service


import http from "@/lib/http";

export interface Account {
  id: number;
  name: string;
  type: 'cash' | 'visa' | 'paypal' | 'crypto';
  accountNumber: string;
  balance: number;
  lastUpdated: string;
  verified: boolean;
}

type Example  =  {
  id: number;
  name: string;
  type: 'cash' | 'visa' | 'paypal' | 'crypto';
  accountNumber: string;
  balance: number;
}


export interface CreateAccountRequest {
  name: string;
  type: 'cash' | 'visa' | 'paypal' | 'crypto';
 number: string;
  amount: number;
}

export interface DepositRequest {
  amount: number;
}

// Fetch all accounts
export const getAccounts = async (): Promise<Account[]> => {
  const response = await http.get(`/accounts`, );
    console.log(response);
    
  if (!response?.data.success === true) {
    throw new Error('Failed to fetch accounts');
  }

  return response.data.data.accounts
};

// Create a new account
export const createAccount = async (account: CreateAccountRequest): Promise<Account> => {
  const response = await http.post(`/accounts`, 
    account
  
  );

  if (response?.data.success === false) {
    throw new Error('Failed to fetch accounts');
  }
  return response.data.data
};

// Deposit money into account
export const depositToAccount = async (
  accountId: number,
  deposit: DepositRequest
): Promise<Account> => {
  const response = await http.put(`/accounts/${accountId}/deposit`, deposit);

  if (response?.data.success === false) {
    throw new Error('Failed to deposit to account');
  }

  return response.data.data
};