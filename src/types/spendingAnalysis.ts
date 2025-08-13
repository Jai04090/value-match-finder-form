export interface SpendingPattern {
  category: string;
  frequency: number;
  averageAmount: number;
  totalAmount: number;
  transactionCount: number;
}

export interface FrequencyAnalysis {
  category: string;
  daily: number;
  weekly: number;
  monthly: number;
  pattern: 'daily' | 'weekly' | 'monthly' | 'occasional';
}

export interface SpendingAnalysisData {
  id: string;
  userId: string;
  analysisDate: string;
  totalTransactions: number;
  totalSpending: number;
  spendingByCategory: Record<string, number>;
  frequencyPatterns: Record<string, FrequencyAnalysis>;
  monthlyAverages: Record<string, number>;
  insights: {
    topCategories: string[];
    highFrequencyCategories: string[];
    savingsOpportunities: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface SpendingSuggestion {
  id: string;
  userId: string;
  analysisId: string;
  suggestionType: 'frequency' | 'amount' | 'substitution';
  title: string;
  description: string;
  category: string;
  currentFrequency?: string;
  suggestedFrequency?: string;
  potentialSavings?: number;
  priorityScore: number;
  status: 'pending' | 'accepted' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTask {
  id: string;
  userId: string;
  suggestionId?: string;
  title: string;
  description?: string;
  taskType: 'habit' | 'goal' | 'reminder';
  dueDate?: string;
  recurrencePattern?: string;
  status: 'active' | 'completed' | 'paused';
  completedAt?: string;
  estimatedSavings?: number;
  actualSavings?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCalendarEvent {
  id: string;
  userId: string;
  taskId: string;
  eventTitle: string;
  eventDescription?: string;
  startDate: string;
  endDate?: string;
  isRecurring: boolean;
  icsData?: string;
  createdAt: string;
}