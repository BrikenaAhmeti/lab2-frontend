export type TransactionId = string;

export interface Transaction {
  id: TransactionId;
  userId: string;
  amount: number;
  currency: 'EUR' | 'USD' | 'GBP';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface DeleteTransactionResponse {
  // If your backend returns nothing, set this to `never` and type the axios call as `void`.
  success: boolean;
  id?: TransactionId;
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
