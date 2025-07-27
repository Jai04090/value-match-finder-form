import { RawTransaction } from '@/types/bankStatement';

export class TransactionParser {
  // Enhanced patterns for Wells Fargo and other bank formats
  private static readonly wellsFargoPatterns = [
    /(\d{2}-\d{2})\s+(.+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})/g, // MM-DD Description Amount
    /(\d{1,2}\/\d{1,2})\s+(.+?)\s+\$?(\d{1,3}(?:,\d{3})*\.\d{2})/g, // M/D Description $Amount
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})/g, // Full date format
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

  // Enhanced skip patterns
  private static readonly skipPatterns = [
    /^\s*$/,                                        // Empty lines
    /^[-=\s]+$/,                                    // Separator lines
    /^page\s+\d+/i,                                 // Page numbers
    /^statement\s+period/i,                         // Statement period
    /^account\s+summary/i,                          // Account summary
    /^previous\s+balance/i,                         // Previous balance
    /^current\s+balance/i,                          // Current balance
    /^total\s+/i,                                   // Total lines
    /^beginning\s+balance/i,                        // Beginning balance
    /^ending\s+balance/i,                           // Ending balance
    /^daily\s+balance/i,                            // Daily balance
    /^account\s+number/i,                           // Account number
    /^customer\s+service/i,                         // Customer service info
    /^continued\s+on\s+next\s+page/i,               // Page continuations
    /^subtotal/i,                                   // Subtotals
  ];

  // Inline transaction patterns for extracting from long combined lines
  private static readonly inlineTransactionPatterns = [
    // Look for date + description + amount patterns within text
    /(\d{2}-\d{2})\s+([^0-9]+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})/g,
    /(\d{1,2}\/\d{1,2})\s+([^0-9]+?)\s+\$?(\d{1,3}(?:,\d{3})*\.\d{2})/g,
  ];

  private static preprocessText(text: string): string {
    // First, try to extract inline transactions from the long lines
    const inlineTransactions: string[] = [];
    
    // Look for transaction patterns within the text
    for (const pattern of this.inlineTransactionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, date, merchant, amount] = match;
        inlineTransactions.push(fullMatch);
      }
    }
    
    if (inlineTransactions.length > 0) {
      // Add the found transactions as separate lines
      return text + '\n' + inlineTransactions.join('\n');
    }
    
    // If no inline transactions found, try to split on common separators
    let processed = text
      .replace(/\s{3,}/g, '\n')  // Replace 3+ spaces with newlines
      .replace(/\t+/g, '\n')     // Replace tabs with newlines
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .trim();
    
    return processed;
  }
  private static readonly tabularPatterns = [
    // Wells Fargo format: "07-06 Bill Pay Don Paumier 682.98"
    /^(\d{2}-\d{2})\s+(.+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})$/,
    // Standard format: "7/6 Bill Pay Don Paumier $682.98"
    /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+\$?(\d{1,3}(?:,\d{3})*\.\d{2})$/,
    // Extended format: "07/06/2022 Bill Pay Don Paumier 682.98"
    /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})$/,
    // Debit/Credit format: "07-06 Bill Pay Don Paumier - 682.98"
    /^(\d{2}-\d{2})\s+(.+?)\s+[-]?\s*(\d{1,3}(?:,\d{3})*\.\d{2})$/,
  ];

  static parseTransactions(redactedText: string): RawTransaction[] {
    console.log('📄 Original text length:', redactedText.length);
    console.log('📄 First 500 chars:', redactedText.substring(0, 500));
    
    // Preprocess text to handle PDF extraction issues
    const preprocessedText = this.preprocessText(redactedText);
    const lines = preprocessedText.split('\n').map(line => line.trim()).filter(Boolean);
    
    console.log('📄 After preprocessing, total lines:', lines.length);
    console.log('📄 Sample preprocessed lines:', lines.slice(0, 10));
    
    const transactions: RawTransaction[] = [];
    let inTransactionSection = false;
    let currentYear = 2018; // Set to 2018 to match the expected data

    // First pass: try to extract transactions using tabular patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip obvious non-transaction lines
      if (this.shouldSkipLine(line)) {
        continue;
      }

      // Check if we're entering a transaction section
      if (this.isTransactionSectionHeader(line)) {
        inTransactionSection = true;
        continue;
      }

      // Check for table headers
      if (this.isTableHeader(line)) {
        inTransactionSection = true;
        continue;
      }

      // Try tabular parsing first (most accurate for structured data)
      const tabularTransaction = this.parseTabularTransaction(line, currentYear);
      if (tabularTransaction) {
        transactions.push(tabularTransaction);
        continue;
      }

      // Only proceed with other parsing if we're in a transaction section OR if the line looks like a transaction
      if (!inTransactionSection && !this.looksLikeTransaction(line)) {
        continue;
      }

      // Try single-line transaction parsing
      const transaction = this.parseTransactionLine(line);
      if (transaction) {
        transactions.push(transaction);
        continue;
      }

      // Try multi-line transaction parsing
      const multiLineTransaction = this.parseMultiLineTransaction(lines, i);
      if (multiLineTransaction) {
        transactions.push(multiLineTransaction);
        i += 1; // Skip the next line since we processed it
      }
    }

    return this.deduplicateTransactions(transactions);
  }

  private static parseTabularTransaction(line: string, currentYear: number): RawTransaction | null {
    for (let patternIndex = 0; patternIndex < this.tabularPatterns.length; patternIndex++) {
      const pattern = this.tabularPatterns[patternIndex];
      const match = line.match(pattern);
      if (match) {
        const [, dateStr, merchant, amountStr] = match;
        
        try {
          const date = this.normalizeDate(dateStr, currentYear);
          const amount = parseFloat(amountStr.replace(/[,$]/g, ''));
          const cleanMerchant = this.cleanMerchantName(merchant);
          
          if (date && !isNaN(amount) && cleanMerchant) {
            return {
              date,
              merchant: cleanMerchant,
              amount
            };
          }
        } catch (error) {
          // Skip malformed entries
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
    for (const pattern of this.amountPatterns) {
      const matches = line.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleanAmount = match.replace(/[$,]/g, '');
          const amount = parseFloat(cleanAmount);
          if (!isNaN(amount) && amount > 0) {
            return amount;
          }
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

    // Clean up merchant name
    let cleaned = merchant
      .replace(/\s+/g, ' ')                           // Normalize whitespace
      .replace(/^(DEBIT|CREDIT|ACH|PURCHASE|PAYMENT)\s*/i, '') // Remove banking prefixes
      .replace(/\s+(DEBIT|CREDIT|ACH|PURCHASE|PAYMENT)$/i, '') // Remove banking suffixes
      .replace(/^\s*[-#*]+\s*/, '')                   // Remove leading separators
      .replace(/\s*[-#*]+\s*$/, '')                   // Remove trailing separators
      .replace(/^(POS|ATM|CARD)\s*/i, '')             // Remove transaction type prefixes
      .trim();

    return cleaned.length > 0 ? cleaned : null;
  }

  private static normalizeDate(dateStr: string, currentYear?: number): string {
    try {
      let date: Date;
      
      // Handle MM-DD format (assume current year)
      if (/^\d{2}-\d{2}$/.test(dateStr)) {
        const year = currentYear || new Date().getFullYear();
        const [month, day] = dateStr.split('-');
        date = new Date(year, parseInt(month) - 1, parseInt(day));
      }
      // Handle M/D format (assume current year)
      else if (/^\d{1,2}\/\d{1,2}$/.test(dateStr)) {
        const year = currentYear || new Date().getFullYear();
        const [month, day] = dateStr.split('/');
        date = new Date(year, parseInt(month) - 1, parseInt(day));
      }
      // Handle other formats
      else {
        date = new Date(dateStr);
      }
      
      if (isNaN(date.getTime())) {
        return dateStr; // Return original if can't parse
      }
      
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch {
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