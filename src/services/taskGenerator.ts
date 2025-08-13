import { SpendingSuggestion, FinancialTask } from '@/types/spendingAnalysis';

export class TaskGenerator {
  static generateTasksFromSuggestion(suggestion: SpendingSuggestion): FinancialTask[] {
    const tasks: FinancialTask[] = [];

    switch (suggestion.suggestionType) {
      case 'frequency':
        tasks.push(...this.generateFrequencyTasks(suggestion));
        break;
      case 'amount':
        tasks.push(...this.generateAmountTasks(suggestion));
        break;
      case 'substitution':
        tasks.push(...this.generateSubstitutionTasks(suggestion));
        break;
    }

    return tasks;
  }

  private static generateFrequencyTasks(suggestion: SpendingSuggestion): FinancialTask[] {
    const category = suggestion.category.toLowerCase();
    const tasks: FinancialTask[] = [];

    if (category.includes('food') || category.includes('restaurant')) {
      tasks.push({
        id: crypto.randomUUID(),
        userId: suggestion.userId,
        suggestionId: suggestion.id,
        title: 'Plan weekly meals in advance',
        description: 'Spend 30 minutes every Sunday planning your meals for the week to reduce impulse food purchases.',
        taskType: 'habit',
        recurrencePattern: 'weekly',
        status: 'active',
        estimatedSavings: suggestion.potentialSavings ? suggestion.potentialSavings * 0.4 : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      tasks.push({
        id: crypto.randomUUID(),
        userId: suggestion.userId,
        suggestionId: suggestion.id,
        title: 'Meal prep for 3 days',
        description: 'Prepare meals in advance to avoid ordering takeout during busy weekdays.',
        taskType: 'habit',
        recurrencePattern: 'twice-weekly',
        status: 'active',
        estimatedSavings: suggestion.potentialSavings ? suggestion.potentialSavings * 0.6 : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      tasks.push({
        id: crypto.randomUUID(),
        userId: suggestion.userId,
        suggestionId: suggestion.id,
        title: `Review ${category} spending weekly`,
        description: `Set aside time each week to review and plan your ${category} expenses.`,
        taskType: 'habit',
        recurrencePattern: 'weekly',
        status: 'active',
        estimatedSavings: suggestion.potentialSavings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return tasks;
  }

  private static generateAmountTasks(suggestion: SpendingSuggestion): FinancialTask[] {
    const category = suggestion.category.toLowerCase();

    return [{
      id: crypto.randomUUID(),
      userId: suggestion.userId,
      suggestionId: suggestion.id,
      title: `Set monthly ${category} budget`,
      description: `Create and stick to a monthly budget for ${category} expenses. Track spending throughout the month.`,
      taskType: 'goal',
      dueDate: this.getEndOfMonth(),
      recurrencePattern: 'monthly',
      status: 'active',
      estimatedSavings: suggestion.potentialSavings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];
  }

  private static generateSubstitutionTasks(suggestion: SpendingSuggestion): FinancialTask[] {
    const tasks: FinancialTask[] = [];

    if (suggestion.category === 'Food') {
      tasks.push({
        id: crypto.randomUUID(),
        userId: suggestion.userId,
        suggestionId: suggestion.id,
        title: 'Try 2 new home recipes this week',
        description: 'Find and cook 2 new recipes at home instead of ordering takeout.',
        taskType: 'habit',
        recurrencePattern: 'weekly',
        status: 'active',
        estimatedSavings: suggestion.potentialSavings ? suggestion.potentialSavings * 0.3 : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      tasks.push({
        id: crypto.randomUUID(),
        userId: suggestion.userId,
        suggestionId: suggestion.id,
        title: 'Make coffee at home 3 days this week',
        description: 'Skip the coffee shop and make your morning coffee at home.',
        taskType: 'habit',
        recurrencePattern: 'weekly',
        status: 'active',
        estimatedSavings: suggestion.potentialSavings ? suggestion.potentialSavings * 0.2 : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return tasks;
  }

  private static getEndOfMonth(): string {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return endOfMonth.toISOString();
  }
}