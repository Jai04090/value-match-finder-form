import { RawTransaction, CategorizedTransaction, TransactionCategory, KeywordMap } from '@/types/bankStatement';

export class TransactionCategorizer {
  private static readonly defaultKeywordMap: KeywordMap = {
    Banking: [
      'deposit', 'interest payment', 'ach credit', 'wire transfer', 'stripe', 'ach debit',
      'online transfer', 'transfer', 'bank fee', 'direct deposit', 'payroll',
      'wells fargo', 'checking', 'savings', 'account maintenance', 'bank',
      'pennymac', 'quicken loans', 'rocket mortgage', 'lending', 'finance'
    ],
    ATM: [
      'atm withdrawal', 'atm check', 'cash advance', 'atm fee', 'atm deposit',
      'atm', 'cash withdrawal', 'teller', 'branch withdrawal', 'cash advance fee',
      'cash deposit', 'withdrawal made in a branch', 'branch/store', 'in a branch'
    ],
    Retail: [
      'costco', 'cintas', 'office max', 'officemax', 'fedex', 'ups', 'amazon', 
      'walmart', 'target', 'home depot', 'lowes', 'best buy', 'macy', 'nordstrom', 
      'gap', 'nike', 'apple store', 'cvs', 'walgreens', 'store', 'shop', 'whse',
      'retail', 'purchase', 'merchant', 'pos', 'sale', 'goods', 'supply',
      'hardware', 'electronics', 'clothing', 'pharmacy', 'supermarket', 'warehouse',
      'pets', 'pet store', 'grooming', 'veterinary', 'vet', 'jurassic', 'animal',
      'truck parts', 'pacific truck', 'parts', 'automotive', 'auto parts'
    ],
    Food: [
      'starbucks', '7-eleven', '7 eleven', 'panera', 'panera bread', 'mcdonald', 
      'burger', 'pizza', 'restaurant', 'cafe', 'coffee', 'food', 'grocery', 
      'market', 'subway', 'chipotle', 'taco', 'wendy', 'kfc', 'domino',
      'dining', 'eatery', 'bistro', 'grill', 'deli', 'bakery', 'bar',
      'kroger', 'safeway', 'publix', 'whole foods', 'trader joe', 'gas station',
      'eleven', 'la plaza bakery', 'fast food', 'drive thru'
    ],
    Subscriptions: [
      'comcast', 'vivint', 'netflix', 'spotify', 'subscription', 'monthly', 
      'annual', 'membership', 'recurring', 'at&t', 'att', 'verizon', 'tmobile',
      'internet', 'cable', 'phone', 'cellular', 'streaming', 'software',
      'saas', 'service', 'plan', 'hulu', 'disney', 'amazon prime', 'utilities'
    ],
    Check: [
      'check #', 'check number', 'deposited or cashed check', 'check payment',
      'check deposit', 'check withdrawal', 'personal check', 'cashier check', 'check'
    ],
    Fees: [
      'overdraft', 'service charge', 'maintenance fee', 'monthly fee', 'annual fee',
      'transaction fee', 'processing fee', 'penalty', 'late fee', 'nsf fee',
      'returned item', 'wire fee', 'stop payment', 'account fee', 'insufficient funds'
    ],
    Other: [
      'bill pay', 'payment', 'misc', 'miscellaneous', 'unknown', 'adjustment', 
      'correction', 'reversal', 'refund', 'credit memo', 'insurance', 'tax', 
      'government', 'utility', 'loan payment', 'mortgage'
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
    
    // Enhanced ATM detection - including branch withdrawals
    if (merchantLower.includes('atm withdrawal') || 
        merchantLower.includes('atm check') || 
        merchantLower.includes('atm deposit') ||
        merchantLower.includes('atm fee') ||
        merchantLower.includes('cash withdrawal') ||
        merchantLower.includes('cash deposit') ||
        merchantLower.includes('withdrawal made in a branch') ||
        merchantLower.includes('branch/store') ||
        merchantLower.includes('teller withdrawal') ||
        /atm\s*(withdrawal|deposit|check)/i.test(transaction.merchant)) {
      return 'ATM';
    }
    
    // Enhanced check detection
    if (merchantLower.includes('check #') || 
        merchantLower.includes('check number') ||
        merchantLower.includes('deposited or cashed check') ||
        merchantLower.includes('check payment') ||
        /check\s*#?\d+/i.test(transaction.merchant)) {
      return 'Check';
    }
    
    // Enhanced fee detection
    if (merchantLower.includes('overdraft') ||
        merchantLower.includes('service charge') ||
        merchantLower.includes('maintenance fee') ||
        merchantLower.includes('nsf fee') ||
        merchantLower.includes('returned item') ||
        merchantLower.includes('insufficient funds') ||
        merchantLower.includes('penalty')) {
      return 'Fees';
    }
    
    // Enhanced category matching with better priority order
    const categoryPriority = ['ATM', 'Check', 'Fees', 'Banking', 'Food', 'Subscriptions', 'Retail', 'Other'];
    
    for (const category of categoryPriority) {
      const keywords = keywordMap[category] || [];
      for (const keyword of keywords) {
        if (merchantLower.includes(keyword.toLowerCase())) {
          return category as TransactionCategory;
        }
      }
    }
    
    // Additional pattern matching for common merchant types not caught above
    if (merchantLower.includes('market') || merchantLower.includes('grocery') ||
        merchantLower.includes('bakery') || merchantLower.includes('restaurant')) {
      return 'Food';
    }
    
    if (merchantLower.includes('store') || merchantLower.includes('shop') ||
        merchantLower.includes('parts') || merchantLower.includes('warehouse')) {
      return 'Retail';
    }
    
    if (merchantLower.includes('bank') || merchantLower.includes('financial') ||
        merchantLower.includes('loan') || merchantLower.includes('mortgage')) {
      return 'Banking';
    }
    
    // Enhanced pet/veterinary detection
    if (merchantLower.includes('pet') || merchantLower.includes('vet') ||
        merchantLower.includes('animal') || merchantLower.includes('grooming') ||
        merchantLower.includes('jurassic')) {
      return 'Retail';
    }
    
    // Truck parts and automotive
    if (merchantLower.includes('truck') || merchantLower.includes('auto') ||
        merchantLower.includes('parts') || merchantLower.includes('pacific')) {
      return 'Retail';
    }
    
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
      Check: 0,
      Fees: 0,
      Other: 0
    };

    transactions.forEach(transaction => {
      stats[transaction.category]++;
    });

    return stats;
  }
}