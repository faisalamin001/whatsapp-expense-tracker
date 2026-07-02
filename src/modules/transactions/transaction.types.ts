export interface CreateTransactionInput {
  userId: string;
  messageId: string;
  rawMessage: string;
  amount: number;
  currency: string;
  type: 'expense' | 'income';
  description: string;
  categoryName: string;
  transactionDate: Date;
  aiConfidence: number;
}

export interface TransactionResult {
  id: string;
  amount: string;
  currency: string;
  type: string;
  description: string;
  categoryName: string | null;
  transactionDate: Date;
  createdAt: Date;
}

export interface TransactionSummary {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  currency: string;
  transactionCount: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}
