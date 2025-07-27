export interface RawTransaction {
  date: string;
  merchant: string;
  amount: number;
}

export interface CategorizedTransaction extends RawTransaction {
  category: TransactionCategory;
}

export type TransactionCategory = 'ATM' | 'Food' | 'Retail' | 'Subscriptions' | 'Banking' | 'Other';

export interface ParsedFileData {
  rawText: string;
  redactedText: string;
  transactions: CategorizedTransaction[];
}

export interface ProcessingState {
  step: 'idle' | 'extracting' | 'redacting' | 'parsing' | 'categorizing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface KeywordMap {
  [category: string]: string[];
}