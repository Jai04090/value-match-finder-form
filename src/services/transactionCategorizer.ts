import { RawTransaction, CategorizedTransaction, TransactionCategory, KeywordMap } from '@/types/bankStatement';

export class TransactionCategorizer {
  private static readonly defaultKeywordMap: KeywordMap = {
    ATM: [
      'atm withdrawal', 'cash advance', 'atm fee', 'atm', 'cash', 'withdrawal'
    ],
    Food: [
      'starbucks', 'mcdonald', 'burger', 'pizza', 'restaurant', 'cafe', 'coffee',
      'food', 'grocery', 'market', 'deli', 'bakery', 'dining', 'kitchen',
      'subway', 'domino', 'kfc', 'taco', 'wendy', 'chipotle', 'panera',
      'uber eats', 'doordash', 'grubhub', 'postmates'
    ],
    Retail: [
      'amazon', 'walmart', 'target', 'costco', 'home depot', 'lowes', 'best buy',
      'macy', 'nordstrom', 'gap', 'nike', 'apple store', 'cvs', 'walgreens',
      'store', 'shop', 'retail', 'purchase', 'clothing', 'apparel'
    ],
    Subscriptions: [
      'netflix', 'spotify', 'hulu', 'disney', 'amazon prime', 'youtube',
      'subscription', 'monthly', 'annual', 'membership', 'service',
      'adobe', 'microsoft', 'google', 'dropbox', 'icloud'
    ],
    Banking: [
      'fee', 'service charge', 'interest', 'maintenance', 'overdraft', 'transfer',
      'check', 'deposit', 'credit', 'debit', 'payment', 'balance'
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
      category: this.categorizeTransaction(transaction, keywordMap)
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

  static getCategoryStats(transactions: CategorizedTransaction[]): Record<TransactionCategory, number> {
    const stats: Record<TransactionCategory, number> = {
      ATM: 0,
      Food: 0,
      Retail: 0,
      Subscriptions: 0,
      Banking: 0,
      Other: 0
    };

    transactions.forEach(transaction => {
      stats[transaction.category]++;
    });

    return stats;
  }
}