import { RawTransaction } from '@/types/bankStatement';

export class TransactionParser {
  private static readonly datePatterns = [
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g, // MM/DD/YYYY or M/D/YY
    /\b(\d{4}-\d{2}-\d{2})\b/g, // YYYY-MM-DD
    /\b(\d{2}-\d{2}-\d{4})\b/g, // MM-DD-YYYY
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/gi // Month DD, YYYY
  ];

  private static readonly amountPatterns = [
    /\$?-?\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, // $1,234.56 or -$1,234.56
    /\b(\d{1,3}(?:,\d{3})*\.\d{2})\b/g // 1,234.56
  ];

  private static readonly transactionSectionPatterns = [
    /deposits?\s*(?:&|and)?\s*other\s*credits?/i,
    /atm\s*withdrawals?/i,
    /checks?\s*paid/i,
    /electronic\s*withdrawals?/i,
    /fees?\s*(?:&|and)?\s*service\s*charges?/i,
    /other\s*debits?/i
  ];

  private static readonly skipPatterns = [
    /^\s*(?:date|description|amount|balance|total|subtotal|page|statement)/i,
    /^\s*(?:beginning|ending)\s*balance/i,
    /^\s*(?:continued|carried)\s*(?:forward|over)/i,
    /^\s*\*+\s*$/,
    /^\s*-+\s*$/,
    /^\s*=+\s*$/
  ];

  static parseTransactions(redactedText: string): RawTransaction[] {
    const lines = redactedText.split('\n').map(line => line.trim()).filter(Boolean);
    const transactions: RawTransaction[] = [];
    let inTransactionSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header/footer patterns
      if (this.shouldSkipLine(line)) {
        continue;
      }

      // Check if we're entering a transaction section
      if (this.isTransactionSectionHeader(line)) {
        inTransactionSection = true;
        continue;
      }

      // Skip non-transaction sections
      if (!inTransactionSection && !this.looksLikeTransaction(line)) {
        continue;
      }

      // Try to parse single-line transaction
      const transaction = this.parseTransactionLine(line);
      if (transaction) {
        transactions.push(transaction);
        continue;
      }

      // Try multi-line transaction (merchant on one line, amount/date on next)
      const multiLineTransaction = this.parseMultiLineTransaction(lines, i);
      if (multiLineTransaction) {
        transactions.push(multiLineTransaction);
        i += 1; // Skip the next line since we processed it
      }
    }

    return transactions;
  }

  private static parseTransactionLine(line: string): RawTransaction | null {
    try {
      const date = this.extractDate(line);
      const amount = this.extractAmount(line);
      const merchant = this.extractMerchant(line, date, amount);

      if (date && amount !== null && merchant) {
        return {
          date: this.normalizeDate(date),
          merchant: merchant.trim(),
          amount
        };
      }
    } catch (error) {
      // Skip malformed lines
    }
    
    return null;
  }

  private static shouldSkipLine(line: string): boolean {
    return this.skipPatterns.some(pattern => pattern.test(line));
  }

  private static isTransactionSectionHeader(line: string): boolean {
    return this.transactionSectionPatterns.some(pattern => pattern.test(line));
  }

  private static looksLikeTransaction(line: string): boolean {
    const hasDate = this.extractDate(line) !== null;
    const hasAmount = this.extractAmount(line) !== null;
    return hasDate || hasAmount;
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
      const cleanMerchant = this.extractMerchant(merchantCandidate, null, null);
      if (cleanMerchant) {
        return {
          date: this.normalizeDate(date),
          merchant: cleanMerchant.trim(),
          amount
        };
      }
    }

    return null;
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
          if (!isNaN(amount)) {
            return Math.abs(amount); // Always return positive amount
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
      const amountStr = amount.toString();
      const amountPatterns = [
        new RegExp(`\\$?${amountStr}`, 'g'),
        new RegExp(`\\$?${amount.toFixed(2)}`, 'g'),
        new RegExp(`\\$?${amount.toLocaleString()}`, 'g')
      ];
      
      amountPatterns.forEach(pattern => {
        merchant = merchant.replace(pattern, '').trim();
      });
    }

    // Clean up extra whitespace and common banking terms
    merchant = merchant
      .replace(/\s+/g, ' ')
      .replace(/^(DEBIT|CREDIT|ACH|PURCHASE|PAYMENT)\s*/i, '')
      .trim();

    return merchant.length > 0 ? merchant : null;
  }

  private static normalizeDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr; // Return original if can't parse
      }
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch {
      return dateStr;
    }
  }
}