import { CategorizedTransaction } from '@/types/bankStatement';
import { SpendingPattern, FrequencyAnalysis, SpendingAnalysisData } from '@/types/spendingAnalysis';

export class SpendingAnalyzer {
  static analyzeTransactions(transactions: CategorizedTransaction[]): SpendingAnalysisData {
    const patterns = this.calculateSpendingPatterns(transactions);
    const frequencyAnalysis = this.analyzeFrequencyPatterns(transactions);
    const monthlyAverages = this.calculateMonthlyAverages(transactions);
    const insights = this.generateInsights(patterns, frequencyAnalysis);

    return {
      id: crypto.randomUUID(),
      userId: '', // Will be set when saving to DB
      analysisDate: new Date().toISOString(),
      totalTransactions: transactions.length,
      totalSpending: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      spendingByCategory: this.groupSpendingByCategory(transactions),
      frequencyPatterns: frequencyAnalysis,
      monthlyAverages,
      insights,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private static calculateSpendingPatterns(transactions: CategorizedTransaction[]): SpendingPattern[] {
    const categoryGroups = transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(transaction);
      return acc;
    }, {} as Record<string, CategorizedTransaction[]>);

    return Object.entries(categoryGroups).map(([category, categoryTransactions]) => ({
      category,
      frequency: categoryTransactions.length,
      averageAmount: categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / categoryTransactions.length,
      totalAmount: categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      transactionCount: categoryTransactions.length
    }));
  }

  private static analyzeFrequencyPatterns(transactions: CategorizedTransaction[]): Record<string, FrequencyAnalysis> {
    const categoryGroups = transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(transaction);
      return acc;
    }, {} as Record<string, CategorizedTransaction[]>);

    const frequencyAnalysis: Record<string, FrequencyAnalysis> = {};

    Object.entries(categoryGroups).forEach(([category, categoryTransactions]) => {
      const dates = categoryTransactions.map(t => new Date(t.date)).sort();
      const totalDays = dates.length > 1 ? 
        (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24) : 
        1;

      const daily = categoryTransactions.length / Math.max(totalDays, 1);
      const weekly = daily * 7;
      const monthly = daily * 30;

      let pattern: 'daily' | 'weekly' | 'monthly' | 'occasional' = 'occasional';
      if (daily >= 0.8) pattern = 'daily';
      else if (weekly >= 2) pattern = 'weekly';
      else if (monthly >= 2) pattern = 'monthly';

      frequencyAnalysis[category] = {
        category,
        daily,
        weekly,
        monthly,
        pattern
      };
    });

    return frequencyAnalysis;
  }

  private static calculateMonthlyAverages(transactions: CategorizedTransaction[]): Record<string, number> {
    const categoryTotals = this.groupSpendingByCategory(transactions);
    const totalDays = this.calculateDateRange(transactions);
    const monthlyMultiplier = 30 / Math.max(totalDays, 1);

    const monthlyAverages: Record<string, number> = {};
    Object.entries(categoryTotals).forEach(([category, total]) => {
      monthlyAverages[category] = total * monthlyMultiplier;
    });

    return monthlyAverages;
  }

  private static groupSpendingByCategory(transactions: CategorizedTransaction[]): Record<string, number> {
    return transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);
  }

  private static calculateDateRange(transactions: CategorizedTransaction[]): number {
    if (transactions.length === 0) return 1;
    
    const dates = transactions.map(t => new Date(t.date)).sort();
    return Math.max(1, (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24));
  }

  private static generateInsights(
    patterns: SpendingPattern[], 
    frequencyAnalysis: Record<string, FrequencyAnalysis>
  ): SpendingAnalysisData['insights'] {
    const sortedByAmount = patterns.sort((a, b) => b.totalAmount - a.totalAmount);
    const topCategories = sortedByAmount.slice(0, 3).map(p => p.category);

    const highFrequencyCategories = Object.values(frequencyAnalysis)
      .filter(f => f.weekly >= 2)
      .map(f => f.category);

    const savingsOpportunities = Object.values(frequencyAnalysis)
      .filter(f => f.weekly >= 3 && f.category !== 'Banking')
      .map(f => f.category);

    return {
      topCategories,
      highFrequencyCategories,
      savingsOpportunities
    };
  }
}