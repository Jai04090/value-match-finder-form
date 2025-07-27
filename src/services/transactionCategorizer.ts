import { RawTransaction, CategorizedTransaction, TransactionCategory, KeywordMap } from '@/types/bankStatement';

export class TransactionCategorizer {
  private static readonly defaultKeywordMap: KeywordMap = {
    Banking: [
      'deposit', 'interest payment', 'ach credit', 'wire transfer', 'stripe'
    ],
    ATM: [
      'atm withdrawal', 'atm check', 'cash advance', 'atm fee'
    ],
    Retail: [
      'costco', 'cintas', 'office max', 'officemax', 'fedex', 'ups', 'amazon', 
      'walmart', 'target', 'home depot', 'lowes', 'best buy', 'macy', 'nordstrom', 
      'gap', 'nike', 'apple store', 'cvs', 'walgreens', 'store', 'shop'
    ],
    Food: [
      'starbucks', '7-eleven', '7 eleven', 'panera', 'panera bread', 'mcdonald', 
      'burger', 'pizza', 'restaurant', 'cafe', 'coffee', 'food', 'grocery', 
      'market', 'subway', 'chipotle', 'taco', 'wendy'
    ],
    Subscriptions: [
      'comcast', 'vivint', 'netflix', 'spotify', 'subscription', 'monthly', 
      'annual', 'membership', 'recurring'
    ],
    Other: [
      'check', 'bill pay', 'payment', 'fee', 'charge'
    ]
  };

  static categorizeTransactions(
    transactions: RawTransaction[],
    customKeywordMap?: KeywordMap
  ): CategorizedTransaction[] {
    const keywordMap = customKeywordMap || this.defaultKeywordMap;
    
    return transactions.map(transaction => ({
      ...transaction,
      category: this.categorizeTransaction(transaction, keywordMap),
      type: this.determineTransactionType(transaction)
    }));
  }

  private static categorizeTransaction(
    transaction: RawTransaction,
    keywordMap: KeywordMap
  ): TransactionCategory {
    const merchantLower = transaction.merchant.toLowerCase();
    
    // Special handling for ATM transactions first
    if (merchantLower.includes('atm')) {
      return 'ATM';
    }
    
    // Check for check transactions
    if (merchantLower.includes('check #') || merchantLower.includes('bill pay')) {
      return 'Other';
    }
    
    // Check categories in specific order to avoid Banking over-classification
    const categoriesOrder: (keyof KeywordMap)[] = ['Food', 'Retail', 'Subscriptions', 'ATM', 'Other', 'Banking'];
    
    for (const category of categoriesOrder) {
      const keywords = keywordMap[category] || [];
      
      const hasMatch = keywords.some(keyword => 
        merchantLower.includes(keyword.toLowerCase())
      );
      
      if (hasMatch) {
        return category as TransactionCategory;
      }
    }
    
    // Default to 'Other' if no matches found
    return 'Other';
  }

  static getKeywordMap(): KeywordMap {
    return { ...this.defaultKeywordMap };
  }

  static updateKeywordMap(category: TransactionCategory, keywords: string[]): KeywordMap {
    return {
      ...this.defaultKeywordMap,
      [category]: [...new Set([...this.defaultKeywordMap[category], ...keywords])]
    };
  }

  private static determineTransactionType(transaction: RawTransaction): 'debit' | 'credit' {
    const merchantLower = transaction.merchant.toLowerCase();
    
    // Credit indicators
    const creditKeywords = ['deposit', 'interest payment', 'refund', 'credit', 'transfer in'];
    if (creditKeywords.some(keyword => merchantLower.includes(keyword))) {
      return 'credit';
    }
    
    // Most transactions are debits by default
    return 'debit';
  }

  static getCategoryStats(transactions: CategorizedTransaction[]): Record<TransactionCategory, number> {
    const stats: Record<TransactionCategory, number> = {
      Banking: 0,
      ATM: 0,
      Retail: 0,
      Food: 0,
      Subscriptions: 0,
      Other: 0
    };

    transactions.forEach(transaction => {
      stats[transaction.category]++;
    });

    return stats;
  }
}