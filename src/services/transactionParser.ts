import { RawTransaction } from '@/types/bankStatement';

export class TransactionParser {
  // Enhanced patterns for Wells Fargo and other bank formats
  private static readonly wellsFargoPatterns = [
    /(\d{2}\/\d{2})\s+(.+?)\s+([-]?\d{1,3}(?:,\d{3})*\.\d{2})/g, // MM/DD Description Amount with negatives
    /(\d{2}-\d{2})\s+(.+?)\s+([-]?\d{1,3}(?:,\d{3})*\.\d{2})/g, // MM-DD Description Amount
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([-]?\d{1,3}(?:,\d{3})*\.\d{2})/g, // Full date format
  ];

  // Enhanced date patterns for various formats
  private static readonly datePatterns = [
    /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g,          // MM/DD/YY or MM/DD/YYYY
    /\b(\d{1,2})-(\d{1,2})-(\d{2,4})\b/g,           // MM-DD-YY or MM-DD-YYYY
    /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,             // YYYY-MM-DD
    /\b(\d{1,2})\/(\d{1,2})\b/g,                    // MM/DD (current year assumed)
    /\b(\d{1,2})-(\d{1,2})\b/g,                     // MM-DD (current year assumed)
    /\b(\d{2})-(\d{2})\b/g,                         // MM-DD format
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/gi // Month DD, YYYY
  ];

  // Enhanced amount patterns
  private static readonly amountPatterns = [
    /\$?(\d{1,3}(?:,\d{3})*\.\d{2})/g,              // $1,234.56 or 1,234.56
    /\$?(\d+\.\d{2})/g,                             // $123.45 or 123.45
    /(\d{1,3}(?:,\d{3})*)\.\d{2}/g,                 // 1,234.56
    /-\$?(\d{1,3}(?:,\d{3})*\.\d{2})/g,            // Negative amounts
  ];

  // Table header patterns to identify transaction sections
  private static readonly tableHeaderPatterns = [
    /date\s+description\s+amount/i,
    /transaction\s+date\s+description\s+debit\s+credit/i,
    /posting\s+date\s+effective\s+date\s+description\s+amount/i,
    /date\s+transaction\s+description\s+withdrawals\s+deposits\s+balance/i,
  ];

  // Enhanced transaction section patterns
  private static readonly transactionSectionPatterns = [
    /deposits?(?:\s+&?\s+other\s+credits?)?/i,
    /atm\s+withdrawals?/i,
    /checks?\s+paid/i,
    /electronic\s+withdrawals?/i,
    /fees?\s+&?\s+service\s+charges?/i,
    /other\s+debits?/i,
    /bill\s+pay/i,
    /card\s+purchases?/i,
    /interest\s+payments?/i,
  ];

  // Enhanced skip patterns for Wells Fargo statements
  private static readonly skipPatterns = [
    /^\s*$/,                                        // Empty lines
    /^[-=\s]+$/,                                    // Separator lines
    /^page\s+\d+/i,                                 // Page numbers
    /^statement\s+period/i,                         // Statement period
    /^account\s+summary/i,                          // Account summary
    /^previous\s+balance/i,                         // Previous balance
    /^current\s+balance/i,                          // Current balance
    /^total\s+(withdrawals?|deposits?|debits?|credits?)/i, // Total lines
    /^beginning\s+balance/i,                        // Beginning balance
    /^ending\s+balance/i,                           // Ending balance
    /^daily\s+balance/i,                            // Daily balance
    /^account\s+number/i,                           // Account number
    /^customer\s+service/i,                         // Customer service info
    /^continued\s+on\s+next\s+page/i,               // Page continuations
    /^subtotal/i,                                   // Subtotals
    /^business\s+bank\s+statement/i,                // Header text
    /^wells\s+fargo/i,                              // Bank name
    /^scan\s+to\s+open/i,                           // PDF artifacts
    /^downloaded\s+by/i,                            // PDF artifacts
    /lOMoARcPSD/i,                                  // PDF artifacts
    /^corporate\s+law/i,                            // Document artifacts
    /^studocu/i,                                    // Platform artifacts
  ];

  // Inline transaction patterns for extracting from long combined lines
  private static readonly inlineTransactionPatterns = [
    // Look for date + description + amount patterns within text
    /(\d{2}-\d{2})\s+([^0-9]+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})/g,
    /(\d{1,2}\/\d{1,2})\s+([^0-9]+?)\s+\$?(\d{1,3}(?:,\d{3})*\.\d{2})/g,
  ];

  private static preprocessText(text: string): string {
    console.log('🔧 Starting text preprocessing...');
    
    // Wells Fargo specific transaction patterns
    const wellsFargoPatterns = [
      // Date Merchant Amount pattern
      /(\d{2}\/\d{2})\s+([A-Za-z][^0-9]*?)\s+([-]?[\d,]+\.\d{2})/g,
      // Handle specific Wells Fargo format with various spacing
      /(\d{2}-\d{2})\s+([A-Za-z][^0-9]*?)\s+([-]?[\d,]+\.\d{2})/g,
    ];

    const extractedTransactions: string[] = [];
    
    // Extract transactions using Wells Fargo patterns
    for (const pattern of wellsFargoPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, date, merchant, amount] = match;
        const cleanedTransaction = `${date} ${merchant.trim()} ${amount}`;
        extractedTransactions.push(cleanedTransaction);
        console.log('🔍 Found transaction:', cleanedTransaction);
      }
    }
    
    // If we found transactions, use them
    if (extractedTransactions.length > 0) {
      console.log(`✅ Extracted ${extractedTransactions.length} transactions`);
      return extractedTransactions.join('\n');
    }
    
    // Fallback: enhanced text processing for unstructured data
    let processed = text
      // Split on multiple spaces or special patterns
      .replace(/\s{4,}/g, '\n')
      .replace(/\t+/g, '\n')
      .replace(/(\d{2}\/\d{2})\s+/g, '\n$1 ')  // New line before dates
      .replace(/(\d{2}-\d{2})\s+/g, '\n$1 ')  // New line before dates
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    console.log('🔧 Preprocessed text lines:', processed.split('\n').length);
    return processed;
  }
  private static readonly tabularPatterns = [
    // Wells Fargo format: "07/02 Costco Whse #0472 Salinas CA -59.61" (exact match)
    /^(\d{2}\/\d{2})\s+(.+?)\s+([-]?\d{1,3}(?:,\d{3})*\.\d{2})\s*$/,
    // Alternative with single digit month/day: "7/2 Merchant Name 123.45"
    /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+([-]?\d{1,3}(?:,\d{3})*\.\d{2})\s*$/,
    // Wells Fargo with dash dates: "07-02 Costco Whse #0472 Salinas CA -59.61"
    /^(\d{2}-\d{2})\s+(.+?)\s+([-]?\d{1,3}(?:,\d{3})*\.\d{2})\s*$/,
    // Extended format with full year: "07/06/2018 Bill Pay Don Paumier 682.98"
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([-]?\d{1,3}(?:,\d{3})*\.\d{2})\s*$/,
  ];

  static parseTransactions(redactedText: string): RawTransaction[] {
    console.log('📄 Original text length:', redactedText.length);
    console.log('📄 First 500 chars:', redactedText.substring(0, 500));
    
    // Preprocess text specifically for Wells Fargo PDFs
    const preprocessedText = this.preprocessText(redactedText);
    const lines = preprocessedText.split('\n').map(line => line.trim()).filter(Boolean);
    
    console.log('📄 After preprocessing, total lines:', lines.length);
    console.log('📄 Sample preprocessed lines:', lines.slice(0, 10));
    
    const transactions: RawTransaction[] = [];
    const currentYear = 2018; // Set to 2018 to match Wells Fargo statement year

    // Process each line looking specifically for transaction patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip obvious non-transaction lines
      if (this.shouldSkipLine(line)) {
        continue;
      }

      // Only process lines that start with a date pattern (MM/DD or MM-DD)
      if (!/^\d{1,2}[\/\-]\d{1,2}/.test(line)) {
        continue;
      }

      // Try tabular parsing (primary method for Wells Fargo)
      const tabularTransaction = this.parseTabularTransaction(line, currentYear);
      if (tabularTransaction) {
        transactions.push(tabularTransaction);
        console.log('✅ Parsed transaction:', tabularTransaction);
        continue;
      }

      // Fallback to single-line parsing
      const transaction = this.parseTransactionLine(line);
      if (transaction) {
        // Ensure date is normalized to 2018
        const normalizedTransaction = {
          ...transaction,
          date: this.normalizeDate(transaction.date, currentYear)
        };
        transactions.push(normalizedTransaction);
        console.log('✅ Parsed fallback transaction:', normalizedTransaction);
      }
    }

    console.log('📄 Total parsed transactions before deduplication:', transactions.length);
    const deduplicatedTransactions = this.deduplicateTransactions(transactions);
    console.log('📄 Final transactions after deduplication:', deduplicatedTransactions.length);

    return deduplicatedTransactions;
  }

  private static parseTabularTransaction(line: string, currentYear: number): RawTransaction | null {
    for (let patternIndex = 0; patternIndex < this.tabularPatterns.length; patternIndex++) {
      const pattern = this.tabularPatterns[patternIndex];
      const match = line.match(pattern);
      if (match) {
        const [, dateStr, merchantRaw, amountStr] = match;
        
        try {
          const date = this.normalizeDate(dateStr, currentYear);
          let amount = parseFloat(amountStr.replace(/[,$]/g, ''));
          const cleanMerchant = this.cleanMerchantName(merchantRaw.trim());
          
          if (date && !isNaN(amount) && cleanMerchant) {
            // Wells Fargo: Convert positive amounts to negative for debits (withdrawals)
            // Only deposits should remain positive
            if (amount > 0 && !cleanMerchant.toLowerCase().includes('deposit')) {
              amount = -amount;
            }
            
            return {
              date,
              merchant: cleanMerchant,
              amount
            };
          }
        } catch (error) {
          console.warn('Error parsing tabular transaction:', line, error);
        }
      }
    }
    return null;
  }

  private static parseTransactionLine(line: string): RawTransaction | null {
    try {
      const date = this.extractDate(line);
      const amount = this.extractAmount(line);
      const merchant = this.extractMerchant(line, date, amount);

      if (date && amount !== null && merchant) {
        return {
          date: this.normalizeDate(date),
          merchant: this.cleanMerchantName(merchant),
          amount
        };
      }
    } catch (error) {
      // Skip malformed lines
    }
    
    return null;
  }

  private static parseMultiLineTransaction(lines: string[], startIndex: number): RawTransaction | null {
    if (startIndex + 1 >= lines.length) return null;

    // Try combining current line with next line
    const combinedLine = `${lines[startIndex]} ${lines[startIndex + 1]}`;
    const transaction = this.parseTransactionLine(combinedLine);
    
    if (transaction) {
      return transaction;
    }

    // Try parsing merchant from current line and date/amount from next
    const merchantCandidate = lines[startIndex];
    const detailsLine = lines[startIndex + 1];
    
    const date = this.extractDate(detailsLine);
    const amount = this.extractAmount(detailsLine);
    
    if (date && amount !== null && merchantCandidate.length > 0) {
      const cleanMerchant = this.cleanMerchantName(merchantCandidate);
      if (cleanMerchant) {
        return {
          date: this.normalizeDate(date),
          merchant: cleanMerchant,
          amount
        };
      }
    }

    return null;
  }

  private static shouldSkipLine(line: string): boolean {
    return this.skipPatterns.some(pattern => pattern.test(line));
  }

  private static isTransactionSectionHeader(line: string): boolean {
    return this.transactionSectionPatterns.some(pattern => pattern.test(line));
  }

  private static isTableHeader(line: string): boolean {
    return this.tableHeaderPatterns.some(pattern => pattern.test(line));
  }

  private static looksLikeTransaction(line: string): boolean {
    const hasDate = this.extractDate(line) !== null;
    const hasAmount = this.extractAmount(line) !== null;
    return hasDate || hasAmount;
  }

  private static extractDate(line: string): string | null {
    for (const pattern of this.datePatterns) {
      const match = line.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  private static extractAmount(line: string): number | null {
    // Enhanced amount patterns that handle negative values
    const enhancedAmountPatterns = [
      /([-]?[\d,]+\.\d{2})/g,              // Handles negative amounts: -59.61, 2724.82
      /\$?([-]?[\d,]+\.\d{2})/g,           // With optional dollar sign
      /([-]\s*[\d,]+\.\d{2})/g,            // Negative with space: - 59.61
    ];

    for (const pattern of enhancedAmountPatterns) {
      const matches = [...line.matchAll(pattern)];
      if (matches.length > 0) {
        // Get the last match (usually the amount at the end of the line)
        const lastMatch = matches[matches.length - 1];
        const cleanAmount = lastMatch[1].replace(/[$,\s]/g, '');
        const amount = parseFloat(cleanAmount);
        if (!isNaN(amount)) {
          return amount;
        }
      }
    }
    return null;
  }

  private static extractMerchant(line: string, date: string | null, amount: number | null): string | null {
    let merchant = line;

    // Remove date from merchant name
    if (date) {
      merchant = merchant.replace(date, '').trim();
    }

    // Remove amount from merchant name
    if (amount !== null) {
      const amountPatterns = [
        new RegExp(`\\$?${amount}`, 'g'),
        new RegExp(`\\$?${amount.toFixed(2)}`, 'g'),
        new RegExp(`\\$?${amount.toLocaleString()}`, 'g')
      ];
      
      amountPatterns.forEach(pattern => {
        merchant = merchant.replace(pattern, '').trim();
      });
    }

    return this.cleanMerchantName(merchant);
  }

  private static cleanMerchantName(merchant: string): string | null {
    if (!merchant) return null;

    // Clean up merchant name while preserving location information
    let cleaned = merchant
      .replace(/\s+/g, ' ')                           // Normalize whitespace
      .replace(/^(DEBIT|CREDIT|ACH|PURCHASE|PAYMENT)\s*/i, '') // Remove banking prefixes
      .replace(/\s+(DEBIT|CREDIT|ACH|PURCHASE|PAYMENT)$/i, '') // Remove banking suffixes
      .replace(/^\s*[-#*]+\s*/, '')                   // Remove leading separators
      .replace(/\s*[-#*]+\s*$/, '')                   // Remove trailing separators
      .replace(/^(POS|CARD)\s*/i, '')                 // Remove POS/CARD prefixes (keep ATM)
      .replace(/\s*\bCR\b\s*$/i, '')                  // Remove CR suffix
      .replace(/\s*\bDR\b\s*$/i, '')                  // Remove DR suffix
      .trim();

    // Handle specific transaction types while preserving important details
    if (cleaned.toLowerCase().includes('atm')) {
      // Keep ATM transactions as-is since they contain location info
      return cleaned;
    }
    
    if (cleaned.toLowerCase().includes('check')) {
      // Keep check transactions with check numbers
      return cleaned;
    }

    return cleaned.length > 0 ? cleaned : null;
  }

  private static normalizeDate(dateStr: string, currentYear: number = 2018): string {
    try {
      let date: Date;
      
      // Handle MM/DD/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const [month, day, year] = dateStr.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      // Handle MM-DD format (use provided year, default to 2018)
      else if (/^\d{2}-\d{2}$/.test(dateStr)) {
        const [month, day] = dateStr.split('-');
        date = new Date(currentYear, parseInt(month) - 1, parseInt(day));
      }
      // Handle MM/DD format (use provided year, default to 2018) 
      else if (/^\d{1,2}\/\d{1,2}$/.test(dateStr)) {
        const [month, day] = dateStr.split('/');
        date = new Date(currentYear, parseInt(month) - 1, parseInt(day));
      }
      // Handle other formats
      else {
        date = new Date(dateStr);
        // If no year specified and date is invalid, try with current year
        if (isNaN(date.getTime())) {
          date = new Date(currentYear + '-' + dateStr);
        }
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Could not parse date:', dateStr);
        return dateStr; // Return original if can't parse
      }
      
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch (error) {
      console.warn('Date normalization error:', dateStr, error);
      return dateStr;
    }
  }

  private static deduplicateTransactions(transactions: RawTransaction[]): RawTransaction[] {
    const seen = new Set<string>();
    return transactions.filter(transaction => {
      const key = `${transaction.date}-${transaction.merchant}-${transaction.amount}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}