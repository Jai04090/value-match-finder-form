
import { RawTransaction } from '@/types/bankStatement';

export interface ParsedLine {
  date: string | null;
  merchant: string | null;
  amount: number | null;
  confidence: number;
  lineIndex: number;
}

export interface MultiLineTransaction {
  lines: string[];
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export class EnhancedPatternMatcher {
  private static readonly LOCALE_PATTERNS = {
    US: {
      dateFormats: [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
        /(\d{1,2})\/(\d{1,2})\/(\d{2})/g,
        /(\d{1,2})\/(\d{1,2})/g
      ],
      amountFormats: [
        /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
        /(\d{1,3}(?:,\d{3})*\.\d{2})/g
      ],
      decimalSeparator: '.',
      thousandsSeparator: ','
    },
    EU: {
      dateFormats: [
        /(\d{1,2})\.(\d{1,2})\.(\d{4})/g,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
        /(\d{1,2})-(\d{1,2})-(\d{4})/g
      ],
      amountFormats: [
        /€\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g,
        /(\d{1,3}(?:\.\d{3})*,\d{2})/g
      ],
      decimalSeparator: ',',
      thousandsSeparator: '.'
    }
  };

  private static readonly UNIVERSAL_PATTERNS = {
    dates: [
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g,
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b/g,
      /\b(\d{1,2})[\/\-\.](\d{1,2})\b/g,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
      /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/gi
    ],
    amounts: [
      /[€$£¥₹]\s*(\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)/g,
      /(\d{1,3}(?:[,.\s]\d{3})*[.,]\d{2})\s*[€$£¥₹]/g,
      /(?:^|\s)([+-]?\d{1,3}(?:[,.\s]\d{3})*[.,]\d{2})(?:\s|$)/g,
      /(?:^|\s)([+-]?\d+[.,]\d{2})(?:\s|$)/g
    ],
    csvDelimiters: [',', ';', '\t', '|'],
    merchants: [
      /\b([A-Z][A-Z\s&\-'\.]{3,}(?:\s+(?:INC|LLC|CORP|CO|LTD|LP))?)\b/g,
      /\b([A-Z][a-zA-Z\s&\-'\.]{4,})\b/g,
      /([a-zA-Z]+[a-zA-Z\s\-\.]{3,})/g
    ]
  };

  static detectLocale(text: string): 'US' | 'EU' | 'UNIVERSAL' {
    const usIndicators = [
      /\$\d+\.\d{2}/g,
      /\d{1,2}\/\d{1,2}\/\d{4}/g,
      /(Wells Fargo|Bank of America|Chase|Citi)/i
    ];

    const euIndicators = [
      /€\d+,\d{2}/g,
      /\d{1,2}\.\d{1,2}\.\d{4}/g,
      /(Deutsche Bank|BNP Paribas|Santander|ING)/i
    ];

    const usMatches = usIndicators.reduce((count, pattern) => count + (text.match(pattern) || []).length, 0);
    const euMatches = euIndicators.reduce((count, pattern) => count + (text.match(pattern) || []).length, 0);

    if (usMatches > euMatches && usMatches > 2) return 'US';
    if (euMatches > usMatches && euMatches > 2) return 'EU';
    return 'UNIVERSAL';
  }

  static detectFormat(text: string): 'CSV' | 'TSV' | 'TABULAR' | 'NARRATIVE' | 'MIXED' {
    const lines = text.split('\n').slice(0, 20); // Check first 20 lines
    
    const csvLines = lines.filter(line => (line.match(/,/g) || []).length >= 2).length;
    const tsvLines = lines.filter(line => (line.match(/\t/g) || []).length >= 2).length;
    const tabularLines = lines.filter(line => /\d{1,2}[\/\-]\d{1,2}.*\$?\d+\.?\d*/.test(line)).length;
    
    if (csvLines > lines.length * 0.7) return 'CSV';
    if (tsvLines > lines.length * 0.7) return 'TSV';
    if (tabularLines > lines.length * 0.5) return 'TABULAR';
    if (csvLines > 0 || tsvLines > 0) return 'MIXED';
    return 'NARRATIVE';
  }

  static parseAmountWithLocale(amountStr: string, locale: 'US' | 'EU' | 'UNIVERSAL'): number | null {
    if (!amountStr) return null;

    // Remove currency symbols
    let cleaned = amountStr.replace(/[€$£¥₹\s]/g, '');
    
    if (locale === 'EU') {
      // EU format: 1.234,56
      if (/\d+\.\d{3}/.test(cleaned) && cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else if (cleaned.includes(',') && !cleaned.includes('.')) {
        cleaned = cleaned.replace(',', '.');
      }
    } else {
      // US format: 1,234.56
      if (/\d+,\d{3}/.test(cleaned) && cleaned.includes('.')) {
        cleaned = cleaned.replace(/,/g, '');
      } else if (cleaned.includes(',') && !cleaned.includes('.')) {
        // Ambiguous case, use context
        const parts = cleaned.split(',');
        if (parts[parts.length - 1].length === 2) {
          cleaned = cleaned.replace(/,/g, '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      }
    }

    const amount = parseFloat(cleaned);
    return isNaN(amount) ? null : amount;
  }

  static extractDateComponents(line: string, locale: 'US' | 'EU' | 'UNIVERSAL'): string | null {
    const patterns = locale === 'UNIVERSAL' 
      ? this.UNIVERSAL_PATTERNS.dates 
      : [...this.LOCALE_PATTERNS[locale].dateFormats, ...this.UNIVERSAL_PATTERNS.dates];

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  static extractAmountComponents(line: string, locale: 'US' | 'EU' | 'UNIVERSAL'): string | null {
    const patterns = locale === 'UNIVERSAL' 
      ? this.UNIVERSAL_PATTERNS.amounts 
      : [...this.LOCALE_PATTERNS[locale].amountFormats, ...this.UNIVERSAL_PATTERNS.amounts];

    const amounts: string[] = [];
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        amounts.push(match[1] || match[0]);
      }
    }

    // Return the most likely amount (usually the last monetary value)
    if (amounts.length > 0) {
      return amounts[amounts.length - 1];
    }
    return null;
  }

  static extractMerchantFromLine(line: string, dateStr?: string, amountStr?: string): string | null {
    let merchant = line;

    // Remove date
    if (dateStr) {
      const dateRegex = new RegExp(dateStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      merchant = merchant.replace(dateRegex, '').trim();
    }

    // Remove amount
    if (amountStr) {
      const amountRegex = new RegExp(amountStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      merchant = merchant.replace(amountRegex, '').trim();
    }

    // Clean up extra whitespace and artifacts
    merchant = merchant.replace(/\s+/g, ' ').trim();
    merchant = merchant.replace(/^[,;\-\s]+|[,;\-\s]+$/g, '');

    return merchant.length >= 2 ? merchant : null;
  }

  static detectMultiLineTransactions(lines: string[]): MultiLineTransaction[] {
    const multiLineTransactions: MultiLineTransaction[] = [];
    let currentTransaction: string[] = [];
    let startIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const hasDate = this.extractDateComponents(line, 'UNIVERSAL') !== null;
      const hasAmount = this.extractAmountComponents(line, 'UNIVERSAL') !== null;
      
      if (hasDate && !hasAmount && currentTransaction.length === 0) {
        // Start of potential multi-line transaction
        currentTransaction = [line];
        startIndex = i;
      } else if (currentTransaction.length > 0 && hasAmount && !hasDate) {
        // End of multi-line transaction
        currentTransaction.push(line);
        multiLineTransactions.push({
          lines: [...currentTransaction],
          startIndex,
          endIndex: i,
          confidence: 0.8
        });
        currentTransaction = [];
        startIndex = -1;
      } else if (currentTransaction.length > 0 && !hasDate && !hasAmount && line.length > 5) {
        // Continuation line
        currentTransaction.push(line);
      } else if (currentTransaction.length > 0) {
        // Reset if we hit something that doesn't fit
        currentTransaction = [];
        startIndex = -1;
      }
    }

    return multiLineTransactions;
  }

  static parseCSVLine(line: string, delimiter: string, headers?: string[]): ParsedLine | null {
    const columns = line.split(delimiter);
    if (columns.length < 3) return null;

    let dateCol = -1, merchantCol = -1, amountCol = -1;

    if (headers) {
      dateCol = headers.findIndex(h => /date/i.test(h));
      merchantCol = headers.findIndex(h => /(description|merchant|payee|memo)/i.test(h));
      amountCol = headers.findIndex(h => /(amount|debit|credit|value)/i.test(h));
    }

    // Auto-detect columns if headers not found
    if (dateCol === -1 || merchantCol === -1 || amountCol === -1) {
      for (let i = 0; i < Math.min(columns.length, 6); i++) {
        const col = columns[i].trim();
        if (dateCol === -1 && this.extractDateComponents(col, 'UNIVERSAL')) {
          dateCol = i;
        } else if (amountCol === -1 && this.extractAmountComponents(col, 'UNIVERSAL')) {
          amountCol = i;
        } else if (merchantCol === -1 && col.length > 2 && !/^\d+$/.test(col)) {
          merchantCol = i;
        }
      }
    }

    if (dateCol >= 0 && merchantCol >= 0 && amountCol >= 0) {
      const dateStr = this.extractDateComponents(columns[dateCol], 'UNIVERSAL');
      const merchantStr = columns[merchantCol].trim();
      const amountStr = this.extractAmountComponents(columns[amountCol], 'UNIVERSAL');

      if (dateStr && merchantStr && amountStr) {
        const amount = this.parseAmountWithLocale(amountStr, 'UNIVERSAL');
        if (amount !== null) {
          return {
            date: dateStr,
            merchant: merchantStr,
            amount,
            confidence: 0.9,
            lineIndex: 0
          };
        }
      }
    }

    return null;
  }
}
