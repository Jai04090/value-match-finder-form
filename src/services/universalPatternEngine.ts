import { BankProfile } from './bankDetector';

export interface PatternConfig {
  datePatterns: RegExp[];
  amountPatterns: RegExp[];
  merchantPatterns: RegExp[];
  transactionPatterns: RegExp[];
  skipPatterns: RegExp[];
  sectionPatterns: RegExp[];
}

export class UniversalPatternEngine {
  private static readonly baseDatePatterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g,          // MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/g,           // MM/DD/YY, MM-DD-YY, MM.DD.YY
    /(\d{1,2})[\/\-\.](\d{1,2})/g,                          // MM/DD, MM-DD, MM.DD
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g,           // YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/gi, // DD MMM YYYY
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/gi, // MMM DD, YYYY
    /(\d{1,2})\s+(\d{1,2})\s+(\d{4})/g,                     // DD MM YYYY (space separated)
    /(\d{4})\s+(\d{1,2})\s+(\d{1,2})/g                      // YYYY MM DD (space separated)
  ];

  private static readonly baseAmountPatterns = [
    /\$?(\d{1,3}(?:,\d{3})*\.?\d{0,2})/g,                  // $1,234.56 or 1234.56
    /([+-]?\d{1,3}(?:,\d{3})*\.\d{2})/g,                   // -1,234.56 or +1,234.56
    /(\d+\.\d{2})/g,                                        // Simple decimal amounts
    /\$(\d+)/g,                                             // Dollar amounts without cents
    /([+-]?\d+)/g,                                          // Simple integers
    /(\d{1,8}(?:,\d{3})*\.?\d{0,2})/g,                     // Larger amounts without $ sign
    /([+-]?\d{1,8}(?:,\d{3})*\.\d{0,2})/g                  // Larger amounts with +/-
  ];

  private static readonly baseMerchantPatterns = [
    /(?:^|\s)([A-Z][A-Z\s&\-'\.]+(?:\s+(?:INC|LLC|CORP|CO|LTD|LP))?)/g,  // Company names
    /(?:^|\s)([A-Z][a-zA-Z\s&\-'\.]{2,})/g,                              // Mixed case merchants (reduced from 3)
    /([A-Z]{2,}\s*[A-Z\d\s\-]{2,})/g,                                     // All caps merchants
    /([a-zA-Z]+[a-zA-Z\s\-\.]{1,})/g,                                     // General text patterns (reduced from 2)
    /([A-Za-z][A-Za-z\s&\-\.]{1,20})/g,                                   // Very lenient merchant names
    /([A-Za-z]+)/g                                                         // Any word starting with letter
  ];

  // MUCH MORE LENIENT skip patterns - only skip obvious non-transaction lines
  private static readonly universalSkipPatterns = [
    /^\s*$/, // Empty lines only
    /^Date\s+Description\s+Amount\s*$/i, // Header only
    /^Total\s*:/i, // Total lines
    /^Balance\s*:/i, // Balance lines
    /^Page\s+\d+\s+of\s+\d+$/i, // Page numbers
    /^Statement\s+Period/i, // Statement headers
    /^Account\s+Number/i, // Account info
    /^Ending\s+Balance/i, // Ending balance
    /^Beginning\s+Balance/i, // Beginning balance
    /^Available\s+Balance/i, // Available balance
    /^Interest\s+Rate/i, // Interest rate
    /^Daily\s+Balance/i, // Daily balance
    /^Average\s+Balance/i, // Average balance
    /^Account\s+Summary/i, // Account summary
    /^\*{4}\d{4}\s*$/ // Masked card numbers only
  ];

  private static readonly universalSectionPatterns = [
    /deposits?(?:\s+&?\s+other\s+credits?)?/i,
    /atm\s+withdrawals?/i,
    /checks?\s+paid/i,
    /electronic\s+withdrawals?/i,
    /fees?\s+&?\s+service\s+charges?/i,
    /other\s+(debits?|credits?)/i,
    /bill\s+pay/i,
    /card\s+purchases?/i,
    /interest\s+payments?/i,
    /transaction\s+history/i,
    /account\s+activity/i,
    /purchases?/i,
    /withdrawals?/i,
    /credits?/i,
    /debits?/i
  ];

  static generatePatternConfig(bankProfile: BankProfile): PatternConfig {
    console.log(`🔧 Generating LENIENT pattern config for ${bankProfile.name}`);
    
    return {
      datePatterns: this.adaptDatePatterns(bankProfile.dateFormats),
      amountPatterns: this.adaptAmountPatterns(bankProfile.currency),
      merchantPatterns: this.baseMerchantPatterns,
      transactionPatterns: this.generateTransactionPatterns(bankProfile),
      skipPatterns: this.universalSkipPatterns,
      sectionPatterns: this.universalSectionPatterns
    };
  }

  private static adaptDatePatterns(dateFormats: string[]): RegExp[] {
    const adaptedPatterns = [...this.baseDatePatterns];
    
    // Add bank-specific patterns based on preferred formats
    dateFormats.forEach(format => {
      switch (format) {
        case 'MM/DD/YYYY':
          adaptedPatterns.unshift(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g);
          break;
        case 'DD/MM/YYYY':
          adaptedPatterns.unshift(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g);
          break;
        case 'YYYY-MM-DD':
          adaptedPatterns.unshift(/(\d{4})-(\d{1,2})-(\d{1,2})/g);
          break;
        case 'MM/DD':
          adaptedPatterns.unshift(/(\d{1,2})\/(\d{1,2})/g);
          break;
      }
    });
    
    return adaptedPatterns;
  }

  private static adaptAmountPatterns(currency: string): RegExp[] {
    const patterns = [...this.baseAmountPatterns];
    
    switch (currency) {
      case 'USD':
        patterns.unshift(/\$(\d{1,3}(?:,\d{3})*\.?\d{0,2})/g);
        break;
      case 'EUR':
        patterns.unshift(/€(\d{1,3}(?:,\d{3})*\.?\d{0,2})/g);
        break;
      case 'GBP':
        patterns.unshift(/£(\d{1,3}(?:,\d{3})*\.?\d{0,2})/g);
        break;
    }
    
    return patterns;
  }

  private static generateTransactionPatterns(bankProfile: BankProfile): RegExp[] {
    const patterns: RegExp[] = [];
    
    bankProfile.transactionFormats.forEach(format => {
      switch (format) {
        case 'tabular':
          patterns.push(
            /(\d{1,2}\/\d{1,2}\/?\d{0,4})\s+(.+?)\s+([+-]?\$?\d{1,3}(?:,\d{3})*\.?\d{0,2})$/,
            /(\d{1,2}\/\d{1,2})\s+(.+?)\s+([+-]?\$?\d+\.?\d*)$/,
            /(\d{1,2}\/\d{1,2}\/?\d{0,4})\s+(.+?)\s+([+-]?\$?\d{1,8}(?:,\d{3})*\.?\d{0,2})$/ // LARGER AMOUNTS
          );
          break;
        case 'narrative':
          patterns.push(
            /(.*?)\s+(\d{1,2}\/\d{1,2}\/?\d{0,4})\s+([+-]?\$?\d+\.?\d*)$/,
            /(.+?)\s+([+-]?\$?\d{1,3}(?:,\d{3})*\.\d{2})$/,
            /(.*?)\s+(\d{1,2}\/\d{1,2}\/?\d{0,4})\s+([+-]?\$?\d{1,8}(?:,\d{3})*\.?\d{0,2})$/ // LARGER AMOUNTS
          );
          break;
        case 'csv':
          patterns.push(
            /"([^"]*?)","([^"]*?)","([^"]*?)"/,
            /([^,]+),([^,]+),([^,]+)/
          );
          break;
        case 'auto_detect':
          patterns.push(...this.getAutoDetectPatterns());
          break;
      }
    });
    
    return patterns.length > 0 ? patterns : this.getAutoDetectPatterns();
  }

  private static getAutoDetectPatterns(): RegExp[] {
    return [
      // Common tabular formats
      /(\d{1,2}\/\d{1,2}\/?\d{0,4})\s+(.+?)\s+([+-]?\$?\d{1,3}(?:,\d{3})*\.?\d{0,2})$/,
      /(\d{1,2}\/\d{1,2})\s+(.+?)\s+([+-]?\$?\d+\.?\d*)$/,
      // Narrative formats
      /(.*?)\s+(\d{1,2}\/\d{1,2}\/?\d{0,4})\s+([+-]?\$?\d+\.?\d*)$/,
      // CSV formats
      /"([^"]*?)","([^"]*?)","([^"]*?)"/,
      /([^,]+),([^,]+),([^,]+)/,
      // Generic patterns - MORE LENIENT
      /(.+?)\s+([+-]?\d{1,8}(?:,\d{3})*\.?\d{0,2})$/,
      /(\d+)\s+(.+?)\s+([+-]?\d+\.?\d*)$/,
      // NEW: Very lenient patterns
      /(.+?)\s+(\d{1,2}[\/\-\.]\d{1,2})\s+([+-]?\d+\.?\d*)/,
      /(\d{1,2}[\/\-\.]\d{1,2})\s+(.+?)\s+([+-]?\d+\.?\d*)/,
      /(.+?)\s+([+-]?\d{1,8}(?:,\d{3})*\.?\d{0,2})/,
      /([+-]?\d{1,8}(?:,\d{3})*\.?\d{0,2})\s+(.+?)/,
      // Space-separated dates
      /(\d{1,2}\s+\d{1,2}\s+\d{4})\s+(.+?)\s+([+-]?\d+\.?\d*)/,
      /(.+?)\s+(\d{1,2}\s+\d{1,2}\s+\d{4})\s+([+-]?\d+\.?\d*)/
    ];
  }

  static extractComponents(line: string, config: PatternConfig): {
    date: string | null;
    merchant: string | null;
    amount: string | null;
    confidence: number;
  } {
    let date: string | null = null;
    let merchant: string | null = null;
    let amount: string | null = null;
    let confidence = 0;

    // Extract date - MORE LENIENT
    for (const pattern of config.datePatterns) {
      pattern.lastIndex = 0; // Reset regex state
      const match = pattern.exec(line);
      if (match) {
        date = match[0];
        confidence += 0.25; // Reduced from 0.3
        break;
      }
    }

    // Extract amount - MORE LENIENT
    for (const pattern of config.amountPatterns) {
      pattern.lastIndex = 0; // Reset regex state
      const matches = Array.from(line.matchAll(pattern));
      if (matches.length > 0) {
        // Take the last amount found (usually the transaction amount)
        amount = matches[matches.length - 1][1] || matches[matches.length - 1][0];
        confidence += 0.3; // Reduced from 0.4
        break;
      }
    }

    // Extract merchant (everything between date and amount) - MORE LENIENT
    if (date && amount) {
      let workingLine = line;
      
      // Remove date from the beginning
      const dateRegex = new RegExp(date.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      workingLine = workingLine.replace(dateRegex, '').trim();
      
      // Remove amount from the end
      const amountRegex = new RegExp(amount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$');
      workingLine = workingLine.replace(amountRegex, '').trim();
      
      if (workingLine.length > 0) { // Reduced from 2
        merchant = workingLine;
        confidence += 0.25; // Reduced from 0.3
      }
    }

    // Fallback merchant extraction using patterns - MORE LENIENT
    if (!merchant) {
      for (const pattern of config.merchantPatterns) {
        pattern.lastIndex = 0; // Reset regex state
        const match = pattern.exec(line);
        if (match && match[1] && match[1].length > 0) { // Reduced from 2
          merchant = match[1];
          confidence += 0.15; // Reduced from 0.2
          break;
        }
      }
    }

    return { date, merchant, amount, confidence };
  }

  static shouldSkipLine(line: string, config: PatternConfig): boolean {
    // MUCH MORE LENIENT - only skip obvious non-transaction lines
    return config.skipPatterns.some(pattern => pattern.test(line));
  }

  static isTransactionSection(line: string, config: PatternConfig): boolean {
    return config.sectionPatterns.some(pattern => pattern.test(line));
  }
}