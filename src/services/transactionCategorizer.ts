import { RawTransaction, CategorizedTransaction, TransactionCategory, KeywordMap } from '@/types/bankStatement';

export class TransactionCategorizer {
  private static readonly defaultKeywordMap: KeywordMap = {
    Banking: [
      'deposit', 'interest payment', 'ach credit', 'wire transfer', 'stripe', 'ach debit',
      'online transfer', 'transfer', 'bank fee', 'direct deposit', 'payroll',
      'wells fargo', 'chase', 'bank of america', 'citibank', 'checking', 'savings', 
      'account maintenance', 'bank', 'credit union', 'financial institution',
      'pennymac', 'quicken loans', 'rocket mortgage', 'lending', 'finance',
      'overdraft protection', 'account fee', 'monthly maintenance', 'service charge',
      'wire fee', 'stop payment', 'returned item', 'nsf fee', 'insufficient funds',
      'stripe transfer', 'stripe payment', 'stripe deposit', 'stripe credit'
    ],
    ATM: [
      'atm withdrawal', 'atm check', 'cash advance', 'atm fee', 'atm deposit',
      'atm', 'cash withdrawal', 'teller', 'branch withdrawal', 'cash advance fee',
      'cash deposit', 'withdrawal made in a branch', 'branch/store', 'in a branch',
      'teller withdrawal', 'cash withdrawal', 'cash deposit', 'branch transaction'
    ],
    Retail: [
      'costco', 'cintas', 'office max', 'officemax', 'fedex', 'ups', 'amazon', 
      'walmart', 'target', 'home depot', 'lowes', 'best buy', 'macy', 'nordstrom', 
      'gap', 'nike', 'apple store', 'cvs', 'walgreens', 'store', 'shop', 'whse',
      'retail', 'purchase', 'merchant', 'pos', 'sale', 'goods', 'supply',
      'hardware', 'electronics', 'clothing', 'pharmacy', 'supermarket', 'warehouse',
      'pets', 'pet store', 'grooming', 'veterinary', 'vet', 'jurassic', 'animal',
      'truck parts', 'pacific truck', 'parts', 'automotive', 'auto parts',
      'department store', 'outlet', 'mall', 'plaza', 'center', 'centre',
      'boutique', 'specialty store', 'convenience store', 'gas station',
      'dollar store', 'thrift store', 'consignment', 'pawn shop', 'antique',
      'furniture', 'appliance', 'jewelry', 'bookstore', 'music store',
      'sporting goods', 'toy store', 'craft store', 'hobby shop'
    ],
    Food: [
      'starbucks', '7-eleven', '7 eleven', 'panera', 'panera bread', 'mcdonald', 
      'burger', 'pizza', 'restaurant', 'cafe', 'diner', 'bistro', 'grill', 'deli', 'bakery', 'bar',
      'kroger', 'safeway', 'publix', 'whole foods', 'trader joe', 'gas station',
      'eleven', 'la plaza bakery', 'fast food', 'drive thru', 'takeout',
      'delivery', 'food truck', 'catering', 'buffet', 'steakhouse', 'seafood',
      'italian', 'chinese', 'mexican', 'japanese', 'thai', 'indian', 'mediterranean',
      'breakfast', 'lunch', 'dinner', 'brunch', 'happy hour', 'wine', 'beer',
      'liquor store', 'convenience store', 'corner store', 'bodega'
    ],
    Subscriptions: [
      'comcast', 'vivint', 'netflix', 'spotify', 'subscription', 'monthly', 
      'annual', 'membership', 'recurring', 'at&t', 'att', 'verizon', 'tmobile',
      'internet', 'cable', 'phone', 'cellular', 'streaming', 'software',
      'saas', 'service', 'plan', 'hulu', 'disney', 'amazon prime', 'utilities',
      'electric', 'water', 'gas', 'sewer', 'trash', 'recycling', 'insurance',
      'health insurance', 'car insurance', 'home insurance', 'life insurance',
      'renters insurance', 'pet insurance', 'gym', 'fitness', 'yoga', 'pilates',
      'magazine', 'newspaper', 'online service', 'cloud storage', 'backup',
      'security system', 'alarm', 'monitoring', 'maintenance', 'cleaning service'
    ],
    Check: [
      'check #', 'check number', 'deposited or cashed check', 'check payment',
      'check deposit', 'check withdrawal', 'personal check', 'cashier check', 'check',
      'check cashing', 'money order', 'cashier check', 'certified check'
    ],
    Fees: [
      'overdraft', 'service charge', 'maintenance fee', 'monthly fee', 'annual fee',
      'transaction fee', 'processing fee', 'penalty', 'late fee', 'nsf fee',
      'returned item', 'wire fee', 'stop payment', 'account fee', 'insufficient funds',
      'atm fee', 'foreign transaction fee', 'balance transfer fee', 'cash advance fee',
      'annual percentage rate', 'apr', 'interest charge', 'finance charge',
      'minimum payment', 'late payment', 'returned check fee', 'overdraft protection fee',
      'fee period', 'period fee', 'account maintenance fee'
    ],
    Other: [
      'bill pay', 'payment', 'misc', 'miscellaneous', 'unknown', 'adjustment', 
      'correction', 'reversal', 'refund', 'credit memo', 'insurance', 'tax', 
      'government', 'utility', 'loan payment', 'mortgage', 'rent', 'tuition',
      'medical', 'healthcare', 'doctor', 'dentist', 'hospital', 'pharmacy',
      'transportation', 'uber', 'lyft', 'taxi', 'parking', 'toll', 'metro',
      'subway', 'bus', 'train', 'airline', 'hotel', 'lodging', 'vacation',
      'travel', 'entertainment', 'movie', 'theater', 'cinema', 'concert', 'show',
      'game', 'sport', 'fitness', 'gym', 'yoga', 'education', 'university',
      'college', 'school', 'tuition', 'textbook', 'course', 'class',
      'charity', 'donation', 'nonprofit', 'foundation', 'church', 'temple',
      'mosque', 'synagogue', 'religious', 'spiritual', 'community service'
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
        merchantLower.includes('branch transaction') ||
        /atm\s*(withdrawal|deposit|check)/i.test(transaction.merchant)) {
      return 'ATM';
    }
    
    // Enhanced check detection
    if (merchantLower.includes('check #') || 
        merchantLower.includes('check number') ||
        merchantLower.includes('deposited or cashed check') ||
        merchantLower.includes('check payment') ||
        merchantLower.includes('check cashing') ||
        merchantLower.includes('money order') ||
        merchantLower.includes('cashier check') ||
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
        merchantLower.includes('penalty') ||
        merchantLower.includes('late fee') ||
        merchantLower.includes('transaction fee') ||
        merchantLower.includes('processing fee') ||
        merchantLower.includes('wire fee') ||
        merchantLower.includes('stop payment') ||
        merchantLower.includes('account fee') ||
        merchantLower.includes('fee period') ||
        merchantLower.includes('period fee')) {
      return 'Fees';
    }
    
    // Enhanced banking detection
    if (merchantLower.includes('deposit') ||
        merchantLower.includes('interest payment') ||
        merchantLower.includes('ach credit') ||
        merchantLower.includes('wire transfer') ||
        merchantLower.includes('direct deposit') ||
        merchantLower.includes('payroll') ||
        merchantLower.includes('online transfer') ||
        merchantLower.includes('transfer') ||
        merchantLower.includes('bank fee') ||
        merchantLower.includes('wells fargo') ||
        merchantLower.includes('chase') ||
        merchantLower.includes('bank of america') ||
        merchantLower.includes('citibank') ||
        merchantLower.includes('credit union') ||
        merchantLower.includes('financial institution') ||
        merchantLower.includes('stripe transfer') ||
        merchantLower.includes('stripe payment') ||
        merchantLower.includes('stripe deposit') ||
        merchantLower.includes('stripe credit') ||
        merchantLower.includes('pennymac')) {
      return 'Banking';
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
        merchantLower.includes('bakery') || merchantLower.includes('restaurant') ||
        merchantLower.includes('cafe') || merchantLower.includes('diner') ||
        merchantLower.includes('bistro') || merchantLower.includes('grill') ||
        merchantLower.includes('deli') || merchantLower.includes('bar') ||
        merchantLower.includes('pub') || merchantLower.includes('pizza') ||
        merchantLower.includes('burger') || merchantLower.includes('taco') ||
        merchantLower.includes('coffee') || merchantLower.includes('fast food')) {
      return 'Food';
    }
    
    if (merchantLower.includes('store') || merchantLower.includes('shop') ||
        merchantLower.includes('parts') || merchantLower.includes('warehouse') ||
        merchantLower.includes('department') || merchantLower.includes('outlet') ||
        merchantLower.includes('mall') || merchantLower.includes('plaza') ||
        merchantLower.includes('center') || merchantLower.includes('centre') ||
        merchantLower.includes('boutique') || merchantLower.includes('specialty')) {
      return 'Retail';
    }
    
    if (merchantLower.includes('bank') || merchantLower.includes('financial') ||
        merchantLower.includes('loan') || merchantLower.includes('mortgage') ||
        merchantLower.includes('credit union') || merchantLower.includes('lending')) {
      return 'Banking';
    }
    
    // Enhanced pet/veterinary detection
    if (merchantLower.includes('pet') || merchantLower.includes('vet') ||
        merchantLower.includes('animal') || merchantLower.includes('grooming') ||
        merchantLower.includes('jurassic') || merchantLower.includes('veterinary')) {
      return 'Retail';
    }
    
    // Truck parts and automotive
    if (merchantLower.includes('truck') || merchantLower.includes('auto') ||
        merchantLower.includes('parts') || merchantLower.includes('pacific') ||
        merchantLower.includes('automotive') || merchantLower.includes('car')) {
      return 'Retail';
    }
    
    // Enhanced subscription detection
    if (merchantLower.includes('comcast') || merchantLower.includes('verizon') ||
        merchantLower.includes('at&t') || merchantLower.includes('tmobile') ||
        merchantLower.includes('netflix') || merchantLower.includes('spotify') ||
        merchantLower.includes('hulu') || merchantLower.includes('disney') ||
        merchantLower.includes('amazon prime') || merchantLower.includes('subscription') ||
        merchantLower.includes('monthly') || merchantLower.includes('annual') ||
        merchantLower.includes('membership') || merchantLower.includes('recurring')) {
      return 'Subscriptions';
    }
    
    // Enhanced utility detection
    if (merchantLower.includes('electric') || merchantLower.includes('water') ||
        merchantLower.includes('gas') || merchantLower.includes('sewer') ||
        merchantLower.includes('trash') || merchantLower.includes('recycling') ||
        merchantLower.includes('utility') || merchantLower.includes('utilities')) {
      return 'Subscriptions';
    }
    
    // Enhanced insurance detection
    if (merchantLower.includes('insurance') || merchantLower.includes('health insurance') ||
        merchantLower.includes('car insurance') || merchantLower.includes('home insurance') ||
        merchantLower.includes('life insurance') || merchantLower.includes('renters insurance') ||
        merchantLower.includes('pet insurance')) {
      return 'Subscriptions';
    }
    
    // Enhanced entertainment detection
    if (merchantLower.includes('movie') || merchantLower.includes('theater') ||
        merchantLower.includes('cinema') || merchantLower.includes('concert') ||
        merchantLower.includes('show') || merchantLower.includes('game') ||
        merchantLower.includes('sport') || merchantLower.includes('fitness') ||
        merchantLower.includes('gym') || merchantLower.includes('yoga')) {
      return 'Other';
    }
    
    // Enhanced transportation detection
    if (merchantLower.includes('uber') || merchantLower.includes('lyft') ||
        merchantLower.includes('taxi') || merchantLower.includes('cab') ||
        merchantLower.includes('parking') || merchantLower.includes('toll') ||
        merchantLower.includes('metro') || merchantLower.includes('subway') ||
        merchantLower.includes('bus') || merchantLower.includes('train') ||
        merchantLower.includes('airline') || merchantLower.includes('hotel') ||
        merchantLower.includes('lodging')) {
      return 'Other';
    }
    
    // Enhanced healthcare detection
    if (merchantLower.includes('medical') || merchantLower.includes('healthcare') ||
        merchantLower.includes('doctor') || merchantLower.includes('dentist') ||
        merchantLower.includes('hospital') || merchantLower.includes('clinic') ||
        merchantLower.includes('urgent care') || merchantLower.includes('pharmacy')) {
      return 'Other';
    }
    
    // Enhanced education detection
    if (merchantLower.includes('university') || merchantLower.includes('college') ||
        merchantLower.includes('school') || merchantLower.includes('tuition') ||
        merchantLower.includes('textbook') || merchantLower.includes('course') ||
        merchantLower.includes('class') || merchantLower.includes('education')) {
      return 'Other';
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
    const creditKeywords = [
      'deposit', 'interest payment', 'refund', 'credit', 'transfer in',
      'direct deposit', 'payroll', 'ach credit', 'wire transfer', 'stripe',
      'cash back', 'reward', 'bonus', 'rebate', 'return', 'reimbursement'
    ];
    
    if (creditKeywords.some(keyword => merchantLower.includes(keyword))) {
      return 'credit';
    }
    
    // Debit indicators
    const debitKeywords = [
      'withdrawal', 'purchase', 'payment', 'fee', 'charge', 'debit',
      'atm withdrawal', 'cash withdrawal', 'check', 'bill pay'
    ];
    
    if (debitKeywords.some(keyword => merchantLower.includes(keyword))) {
      return 'debit';
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