import { SpendingAnalysisData, SpendingSuggestion, FrequencyAnalysis } from '@/types/spendingAnalysis';

export class SuggestionGenerator {
  static generateSuggestions(analysis: SpendingAnalysisData): SpendingSuggestion[] {
    const suggestions: SpendingSuggestion[] = [];

    // Frequency-based suggestions
    suggestions.push(...this.generateFrequencySuggestions(analysis));
    
    // Amount-based suggestions
    suggestions.push(...this.generateAmountSuggestions(analysis));
    
    // Substitution suggestions
    suggestions.push(...this.generateSubstitutionSuggestions(analysis));

    return suggestions.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  private static generateFrequencySuggestions(analysis: SpendingAnalysisData): SpendingSuggestion[] {
    const suggestions: SpendingSuggestion[] = [];

    Object.entries(analysis.frequencyPatterns).forEach(([category, frequency]) => {
      if (frequency.weekly >= 3 && category !== 'Banking') {
        const potentialSavings = this.calculateFrequencyReductionSavings(
          analysis.spendingByCategory[category],
          frequency.weekly
        );

        const currentFreq = this.formatFrequency(frequency.weekly);
        const suggestedFreq = this.formatFrequency(Math.max(1, frequency.weekly - 1));

        suggestions.push({
          id: crypto.randomUUID(),
          userId: analysis.userId,
          analysisId: analysis.id,
          suggestionType: 'frequency',
          title: `Reduce ${category} spending frequency`,
          description: `You're spending on ${category.toLowerCase()} ${currentFreq}. Try reducing to ${suggestedFreq} to save approximately $${potentialSavings.toFixed(0)} per month.`,
          category,
          currentFrequency: currentFreq,
          suggestedFrequency: suggestedFreq,
          potentialSavings,
          priorityScore: this.calculatePriorityScore(potentialSavings, frequency.weekly),
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });

    return suggestions;
  }

  private static generateAmountSuggestions(analysis: SpendingAnalysisData): SpendingSuggestion[] {
    const suggestions: SpendingSuggestion[] = [];

    Object.entries(analysis.spendingByCategory).forEach(([category, amount]) => {
      if (amount > 200 && category !== 'Banking') {
        const potentialSavings = amount * 0.15; // 15% reduction target

        suggestions.push({
          id: crypto.randomUUID(),
          userId: analysis.userId,
          analysisId: analysis.id,
          suggestionType: 'amount',
          title: `Reduce ${category} spending amount`,
          description: `You spend $${amount.toFixed(0)} monthly on ${category.toLowerCase()}. Look for ways to reduce this by 15% to save $${potentialSavings.toFixed(0)} per month.`,
          category,
          potentialSavings,
          priorityScore: this.calculatePriorityScore(potentialSavings, 1),
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });

    return suggestions;
  }

  private static generateSubstitutionSuggestions(analysis: SpendingAnalysisData): SpendingSuggestion[] {
    const suggestions: SpendingSuggestion[] = [];

    // Coffee/Food delivery suggestions
    if (analysis.spendingByCategory['Food'] > 100) {
      const potentialSavings = analysis.spendingByCategory['Food'] * 0.4;

      suggestions.push({
        id: crypto.randomUUID(),
        userId: analysis.userId,
        analysisId: analysis.id,
        suggestionType: 'substitution',
        title: 'Cook more meals at home',
        description: `Replace some restaurant/delivery meals with home cooking. This could save you up to $${potentialSavings.toFixed(0)} per month.`,
        category: 'Food',
        potentialSavings,
        priorityScore: this.calculatePriorityScore(potentialSavings, 2),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return suggestions;
  }

  private static calculateFrequencyReductionSavings(totalAmount: number, currentWeekly: number): number {
    const avgPerTransaction = totalAmount / (currentWeekly * 4); // Monthly average per transaction
    return avgPerTransaction * 4; // Save one transaction per week = 4 per month
  }

  private static formatFrequency(weeklyFreq: number): string {
    if (weeklyFreq >= 7) return 'daily';
    if (weeklyFreq >= 5) return '5-6x per week';
    if (weeklyFreq >= 3) return `${Math.round(weeklyFreq)}x per week`;
    if (weeklyFreq >= 1) return `${Math.round(weeklyFreq * 4)}x per month`;
    return 'occasionally';
  }

  private static calculatePriorityScore(potentialSavings: number, frequency: number): number {
    return Math.round(potentialSavings * 0.1 + frequency * 10);
  }
}