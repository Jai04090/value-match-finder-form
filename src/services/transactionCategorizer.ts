import { RawTransaction, CategorizedTransaction, TransactionCategory, KeywordMap } from '@/types/bankStatement';

export class TransactionCategorizer {
  private static readonly defaultKeywordMap: KeywordMap = {
    Banking: [
      'bill pay', 'interest payment', 'service charge', 'maintenance fee', 
      'overdraft', 'transfer', 'ach', 'wire', 'deposit', 'check', 'fee',
      'interest', 'bank', 'credit', 'debit', 'payment', 'balance'
    ],
    ATM: [
      'atm withdrawal', 'cash advance', 'atm fee', 'atm', 'cash back',
      'withdrawal', 'cash'
    ],
    Retail: [
      'fedex', 'ups', 'amazon', 'walmart', 'target', 'costco', 'purchase',
      'card purchase', 'pos', 'point of sale', 'home depot', 'lowes', 'best buy',
      'macy', 'nordstrom', 'gap', 'nike', 'apple store', 'cvs', 'walgreens',
      'store', 'shop', 'retail', 'clothing', 'apparel'
    ],
    Food: [
      'starbucks', 'mcdonald', 'burger', 'pizza', 'restaurant', 'cafe', 'coffee',
      'food', 'grocery', 'market', 'deli', 'bakery', 'dining', 'kitchen',
      'subway', 'domino', 'kfc', 'taco', 'wendy', 'chipotle', 'panera',
      'uber eats', 'doordash', 'grubhub', 'postmates'
    ],
    Subscriptions: [
      'netflix', 'spotify', 'hulu', 'disney', 'amazon prime', 'youtube',
      'subscription', 'monthly', 'annual', 'membership', 'service',
      'adobe', 'microsoft', 'google', 'dropbox', 'icloud', 'recurring'
    ],
    Other: []
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
    
    // Check each category's keywords
    for (const [category, keywords] of Object.entries(keywordMap)) {
      if (category === 'Other') continue; // Skip 'Other' category in the loop
      
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