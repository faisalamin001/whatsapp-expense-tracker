export type TransactionType = 'expense' | 'income';

export interface ParsedTransaction {
  amount: number;
  currency: string;
  category: string;
  description: string;
  type: TransactionType;
  date: string; // ISO 8601 date string e.g. "2026-07-01"
  confidence: number; // 0.0 – 1.0
}

export interface AIParseResult {
  success: true;
  data: ParsedTransaction;
}

export interface AIParseFailure {
  success: false;
  reason: string;
}

export type AIParseOutcome = AIParseResult | AIParseFailure;
