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

  static parseTransactions(redactedText: string): RawTransaction[] {
    const lines = redactedText.split('\n').map(line => line.trim()).filter(Boolean);
    const transactions: RawTransaction[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const transaction = this.parseTransactionLine(line);
      
      if (transaction) {
        transactions.push(transaction);
      } else {
        // Try to parse multi-line transaction
        const multiLineTransaction = this.parseMultiLineTransaction(lines, i);
        if (multiLineTransaction) {
          transactions.push(multiLineTransaction);
          // Skip the lines we've already processed
          i += 1; // Adjust based on how many lines were consumed
        }
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

  private static parseMultiLineTransaction(lines: string[], startIndex: number): RawTransaction | null {
    if (startIndex + 1 >= lines.length) return null;

    const combinedLine = `${lines[startIndex]} ${lines[startIndex + 1]}`;
    return this.parseTransactionLine(combinedLine);
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