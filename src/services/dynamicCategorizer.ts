import { RawTransaction, CategorizedTransaction, TransactionCategory, KeywordMap } from '@/types/bankStatement';

export interface CategoryRule {
  category: TransactionCategory;
  patterns: RegExp[];
  keywords: string[];
  priority: number;
  confidence: number;
}

export interface CategorizationResult {
  category: TransactionCategory;
  confidence: number;
  matchedRule?: string;
  type: 'debit' | 'credit';
}

export class DynamicCategorizer {
  private static learningData: Map<string, TransactionCategory> = new Map();
  
  private static readonly baseCategoryRules: CategoryRule[] = [
    {
      category: 'Banking',
      patterns: [
        /\b(deposit|interest|ach|wire|transfer|bank|fee|service|charge)\b/i,
        /\b(direct.?deposit|payroll|salary|wages)\b/i,
        /\b(wells.?fargo|bank.?of.?america|chase|citi|us.?bank)\b/i
      ],
      keywords: ['deposit', 'interest', 'ach', 'wire', 'transfer', 'bank', 'payroll', 'finance'],
      priority: 8,
      confidence: 0.9
    },
    {
      category: 'ATM',
      patterns: [
        /\b(atm|cash|withdrawal|teller|branch)\b/i,
        /\b(cash.?(advance|deposit|withdrawal))\b/i,
        /\b(withdrawal.?made.?in.?branch)\b/i
      ],
      keywords: ['atm', 'cash', 'withdrawal', 'teller', 'branch'],
      priority: 9,
      confidence: 0.95
    },
    {
      category: 'Check',
      patterns: [
        /\b(check|ck)[\s#]*\d+/i,
        /\b(deposited|cashed).?check\b/i,
        /\bcheck.?(payment|deposit|withdrawal)\b/i
      ],
      keywords: ['check', 'deposited check', 'cashed check'],
      priority: 9,
      confidence: 0.95
    },
    {
      category: 'Fees',
      patterns: [
        /\b(overdraft|nsf|insufficient|penalty|late|fee|charge)\b/i,
        /\b(service.?charge|maintenance.?fee|returned.?item)\b/i,
        /\b(stop.?payment|wire.?fee)\b/i
      ],
      keywords: ['overdraft', 'nsf', 'insufficient', 'penalty', 'late fee', 'service charge'],
      priority: 8,
      confidence: 0.9
    },
    {
      category: 'Food',
      patterns: [
        /\b(restaurant|cafe|coffee|food|grocery|market|dining)\b/i,
        /\b(starbucks|mcdonald|burger|pizza|subway|chipotle|taco|kfc)\b/i,
        /\b(bakery|deli|bar|grill|bistro|eatery)\b/i,
        /\b(kroger|safeway|whole.?foods|trader.?joe)\b/i
      ],
      keywords: ['restaurant', 'cafe', 'coffee', 'food', 'grocery', 'market', 'starbucks', 'mcdonald'],
      priority: 7,
      confidence: 0.85
    },
    {
      category: 'Retail',
      patterns: [
        /\b(store|shop|retail|purchase|pos|sale|goods|supply)\b/i,
        /\b(amazon|walmart|target|costco|home.?depot|best.?buy)\b/i,
        /\b(cvs|walgreens|pharmacy|macy|nordstrom|gap|nike)\b/i,
        /\b(parts|automotive|hardware|electronics|clothing)\b/i
      ],
      keywords: ['store', 'shop', 'retail', 'amazon', 'walmart', 'target', 'costco', 'cvs'],
      priority: 6,
      confidence: 0.8
    },
    {
      category: 'Subscriptions',
      patterns: [
        /\b(subscription|monthly|annual|membership|recurring)\b/i,
        /\b(netflix|spotify|hulu|disney|amazon.?prime)\b/i,
        /\b(comcast|at&t|att|verizon|tmobile|internet|cable|phone)\b/i,
        /\b(streaming|software|saas|service|plan|utilities)\b/i
      ],
      keywords: ['subscription', 'monthly', 'netflix', 'spotify', 'comcast', 'internet', 'cable'],
      priority: 7,
      confidence: 0.85
    }
  ];

  static categorizeTransactions(
    transactions: RawTransaction[],
    customKeywordMap?: KeywordMap,
    useMLFeatures: boolean = true
  ): CategorizedTransaction[] {
    console.log(`🏷️ Categorizing ${transactions.length} transactions with dynamic categorizer`);
    
    const results: CategorizedTransaction[] = [];
    
    for (const transaction of transactions) {
      const categorization = this.categorizeTransaction(transaction, customKeywordMap, useMLFeatures);
      
      results.push({
        ...transaction,
        category: categorization.category,
        type: categorization.type
      });
      
      // Learn from this categorization for future improvements
      if (useMLFeatures) {
        this.updateLearningData(transaction.merchant, categorization.category);
      }
    }
    
    console.log(`🏷️ Categorization complete with distribution:`, this.getCategoryStats(results));
    return results;
  }

  private static categorizeTransaction(
    transaction: RawTransaction,
    customKeywordMap?: KeywordMap,
    useMLFeatures: boolean = true
  ): CategorizationResult {
    const merchantLower = transaction.merchant.toLowerCase();
    
    // First, check learning data for exact matches
    if (useMLFeatures && this.learningData.has(merchantLower)) {
      const learnedCategory = this.learningData.get(merchantLower)!;
      return {
        category: learnedCategory,
        confidence: 0.95,
        matchedRule: 'learned',
        type: this.determineTransactionType(transaction)
      };
    }
    
    // Check custom keyword map if provided
    if (customKeywordMap) {
      for (const [category, keywords] of Object.entries(customKeywordMap)) {
        for (const keyword of keywords) {
          if (merchantLower.includes(keyword.toLowerCase())) {
            return {
              category: category as TransactionCategory,
              confidence: 0.9,
              matchedRule: 'custom',
              type: this.determineTransactionType(transaction)
            };
          }
        }
      }
    }
    
    // Apply base category rules in priority order
    const sortedRules = [...this.baseCategoryRules].sort((a, b) => b.priority - a.priority);
    
    for (const rule of sortedRules) {
      // Check patterns first (highest confidence)
      for (const pattern of rule.patterns) {
        if (pattern.test(transaction.merchant)) {
          return {
            category: rule.category,
            confidence: rule.confidence,
            matchedRule: 'pattern',
            type: this.determineTransactionType(transaction)
          };
        }
      }
      
      // Check keywords (slightly lower confidence)
      for (const keyword of rule.keywords) {
        if (merchantLower.includes(keyword.toLowerCase())) {
          return {
            category: rule.category,
            confidence: rule.confidence * 0.9,
            matchedRule: 'keyword',
            type: this.determineTransactionType(transaction)
          };
        }
      }
    }
    
    // Advanced pattern matching for uncategorized transactions
    const advancedCategory = this.advancedPatternMatching(transaction);
    if (advancedCategory) {
      return {
        category: advancedCategory,
        confidence: 0.7,
        matchedRule: 'advanced',
        type: this.determineTransactionType(transaction)
      };
    }
    
    // Fuzzy matching for similar merchants
    if (useMLFeatures) {
      const fuzzyCategory = this.fuzzyMerchantMatching(transaction.merchant);
      if (fuzzyCategory) {
        return {
          category: fuzzyCategory,
          confidence: 0.6,
          matchedRule: 'fuzzy',
          type: this.determineTransactionType(transaction)
        };
      }
    }
    
    return {
      category: 'Other',
      confidence: 0.5,
      matchedRule: 'default',
      type: this.determineTransactionType(transaction)
    };
  }

  private static advancedPatternMatching(transaction: RawTransaction): TransactionCategory | null {
    const merchant = transaction.merchant.toLowerCase();
    
    // Domain-specific pattern matching
    const domainPatterns = [
      { patterns: [/\d{3,4}\s*[a-z]+\s*st(reet)?/i, /\d+\s*[ns]\.?\s*main/i], category: 'Retail' as TransactionCategory },
      { patterns: [/kitchen|dining|meal|food|eat/i], category: 'Food' as TransactionCategory },
      { patterns: [/gas|fuel|station|shell|exxon|bp|chevron/i], category: 'Retail' as TransactionCategory },
      { patterns: [/medical|dental|doctor|clinic|hospital|pharmacy/i], category: 'Other' as TransactionCategory },
      { patterns: [/insurance|policy|premium/i], category: 'Other' as TransactionCategory },
      { patterns: [/loan|mortgage|credit|financing/i], category: 'Banking' as TransactionCategory }
    ];
    
    for (const domain of domainPatterns) {
      if (domain.patterns.some(pattern => pattern.test(merchant))) {
        return domain.category;
      }
    }
    
    // Analyze transaction amount patterns
    if (Math.abs(transaction.amount) < 5) {
      return 'Fees'; // Small amounts often fees
    }
    
    if (Math.abs(transaction.amount) > 1000) {
      return 'Banking'; // Large amounts often transfers/deposits
    }
    
    return null;
  }

  private static fuzzyMerchantMatching(merchant: string): TransactionCategory | null {
    const merchantLower = merchant.toLowerCase();
    const threshold = 0.7; // Similarity threshold
    
    for (const [knownMerchant, category] of this.learningData.entries()) {
      const similarity = this.calculateSimilarity(merchantLower, knownMerchant);
      if (similarity >= threshold) {
        console.log(`🔍 Fuzzy match: "${merchant}" ~ "${knownMerchant}" (${similarity.toFixed(2)})`);
        return category;
      }
    }
    
    return null;
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity based on word overlap
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private static determineTransactionType(transaction: RawTransaction): 'debit' | 'credit' {
    const merchantLower = transaction.merchant.toLowerCase();
    
    // Credit indicators
    const creditKeywords = [
      'deposit', 'interest payment', 'refund', 'credit', 'transfer in',
      'payroll', 'salary', 'wages', 'reimbursement', 'dividend'
    ];
    
    if (creditKeywords.some(keyword => merchantLower.includes(keyword))) {
      return 'credit';
    }
    
    // Amount-based determination
    if (transaction.amount > 0) {
      return 'credit';
    }
    
    return 'debit';
  }

  private static updateLearningData(merchant: string, category: TransactionCategory): void {
    const merchantKey = merchant.toLowerCase();
    this.learningData.set(merchantKey, category);
    
    // Limit learning data size to prevent memory issues
    if (this.learningData.size > 10000) {
      const entriesToRemove = Array.from(this.learningData.entries()).slice(0, 1000);
      entriesToRemove.forEach(([key]) => this.learningData.delete(key));
    }
  }

  static getCategoryStats(transactions: CategorizedTransaction[]): Record<TransactionCategory, number> {
    const stats: Record<TransactionCategory, number> = {
      Banking: 0,
      ATM: 0,
      Retail: 0,
      Food: 0,
      Subscriptions: 0,
      Check: 0,
      Fees: 0,
      Other: 0
    };

    transactions.forEach(transaction => {
      stats[transaction.category]++;
    });

    return stats;
  }

  static addCustomCategoryRule(rule: CategoryRule): void {
    this.baseCategoryRules.push(rule);
    // Sort by priority to maintain correct order
    this.baseCategoryRules.sort((a, b) => b.priority - a.priority);
  }

  static exportLearningData(): Record<string, TransactionCategory> {
    return Object.fromEntries(this.learningData);
  }

  static importLearningData(data: Record<string, TransactionCategory>): void {
    this.learningData.clear();
    Object.entries(data).forEach(([merchant, category]) => {
      this.learningData.set(merchant, category);
    });
  }

  static resetLearningData(): void {
    this.learningData.clear();
  }
}