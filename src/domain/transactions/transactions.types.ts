export type TransactionId = string;

export interface Transaction {
  id: TransactionId;
  userId: string;
  amount: number;
  currency: 'EUR' | 'USD' | 'GBP';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface CreateTransactionDTO {
  userId: string;
  amount: number;
  currency: 'EUR' | 'USD' | 'GBP';
}

export interface UpdateTransactionDTO {
  amount?: number;
  currency?: 'EUR' | 'USD' | 'GBP';
  status?: 'pending' | 'completed' | 'failed';
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
