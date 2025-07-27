import { RawTransaction } from '@/types/bankStatement';

export class TransactionParser {
  // Updated patterns for better Wells Fargo parsing
  private static readonly wellsFargoPatterns: RegExp[] = [
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(-?\d+\.\d{2})$/,
    /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+(-?\d+\.\d{2})$/,
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+([^0-9-]+?)\s+(-?\d+\.\d{2})/g
  ];

  private static readonly datePatterns: RegExp[] = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
    /^(\d{1,2})\/(\d{1,2})\b/,
    /(\d{4})-(\d{2})-(\d{2})/
  ];

  private static readonly amountPatterns: RegExp[] = [
    /(-?\d+\.\d{2})$/,
    /\s(-?\d+\.\d{2})(?:\s|$)/,
    /(-?\$?\d{1,3}(?:,\d{3})*\.?\d{0,2})(?:\s|$)/
  ];

  private static readonly tableHeaderPatterns = [
    /date\s+description\s+amount/i,
    /transaction\s+date\s+description\s+debit\s+credit/i,
    /posting\s+date\s+effective\s+date\s+description\s+amount/i,
    /date\s+transaction\s+description\s+withdrawals\s+deposits\s+balance/i,
  ];

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

  private static readonly skipPatterns: RegExp[] = [
    /^(Date|Description|Amount|Balance|Total|Beginning|Ending)/i,
    /^\s*$/,
    /^Page\s+\d+/i,
    /^Wells Fargo/i,
    /^Account Number/i,
    /^Statement Period/i,
    /^Customer Service/i,
    /^\d+\s*$/,
    /^-+\s*$/,
    /^Balance\s+(Forward|Brought)/i,
    /^Total\s+(Deposits|Withdrawals|Fees)/i,
    /^Daily\s+Balance/i,
    /^Average\s+Balance/i,
    /^\$\d+\.\d{2}\s*$/,
    /^(\d+\.\d{2})\s*$/
  ];

  private static readonly inlineTransactionPatterns = [
    /(\d{2}-\d{2})\s+([^0-9]+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})/g,
    /(\d{1,2}\/\d{1,2})\s+([^0-9]+?)\s+\$?(\d{1,3}(?:,\d{3})*\.\d{2})/g,
  ];

  private static preprocessText(text: string): string {
    console.log('🔧 Starting text preprocessing...');
    console.log('📄 Original text sample:', text.substring(0, 300));
    
    // Filter out obvious non-transaction lines early
    const lines = text.split('\n');
    console.log(`📄 Total lines before filtering: ${lines.length}`);
    
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) return false;
      
      // Skip very short lines (likely fragments)
      if (trimmed.length < 5) return false;
      
      // Be more inclusive - keep lines that might contain transaction data
      // Look for patterns that suggest transaction content
      const hasDatePattern = /\d{1,2}\/\d{1,2}/.test(trimmed);
      const hasAmountPattern = /\$?\d+\.\d{2}/.test(trimmed);
      const hasAccountPattern = /\*{4}\d{4}/.test(trimmed); // Wells Fargo account pattern
      const hasTransactionType = /(debit|credit|withdrawal|deposit|check)/i.test(trimmed);
      const hasMerchantIndicators = /(corp|inc|llc|company|store|market|gas|restaurant)/i.test(trimmed);
      
      // Keep lines that have at least one transaction indicator
      if (hasDatePattern || hasAmountPattern || hasAccountPattern || hasTransactionType || hasMerchantIndicators) {
        return true;
      }
      
      // Skip lines that are definitely headers, footers, or account info
      if (this.shouldSkipLine(trimmed)) {
        return false;
      }
      
      // Keep lines with enough content that might be transactions
      return trimmed.length > 20;
    });
    
    console.log(`🔧 Filtered from ${lines.length} to ${filteredLines.length} lines`);
    console.log('📄 Sample filtered lines:', filteredLines.slice(0, 10));
    return filteredLines.join('\n');
  }

  static parseTransactions(redactedText: string): RawTransaction[] {
    console.log('🔧 TransactionParser.parseTransactions called');
    console.log('📄 Original text length:', redactedText.length);
    console.log('📄 First 500 chars:', redactedText.substring(0, 500));
    
    const preprocessedText = this.preprocessText(redactedText);
    console.log('📄 Preprocessed text length:', preprocessedText.length);
    console.log('📄 Preprocessed first 500 chars:', preprocessedText.substring(0, 500));
    
    const lines = preprocessedText.split('\n').filter(line => line.trim());
    console.log('📄 Total lines after preprocessing:', lines.length);
    console.log('📄 Sample lines:', lines.slice(0, 10));
    
    const transactions: RawTransaction[] = [];
    const currentYear = 2018; // Wells Fargo PDF is from 2018
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      console.log(`🔍 Processing line ${i + 1}:`, line);
      
      if (this.shouldSkipLine(line)) {
        console.log(`⏭️ Skipping line ${i + 1} (matches skip pattern)`);
        continue;
      }
      
      // Check for multiple transactions in one line
      const multiTransactions = this.parseMultipleTransactionsFromLine(line, currentYear);
      if (multiTransactions.length > 0) {
        console.log(`✅ Found ${multiTransactions.length} transactions in line ${i + 1}:`, multiTransactions);
        transactions.push(...multiTransactions);
        continue;
      }
      
      // Try to parse as a single tabular transaction
      const tabularTransaction = this.parseTabularTransaction(line, currentYear);
      if (tabularTransaction) {
        console.log(`✅ Parsed tabular transaction from line ${i + 1}:`, tabularTransaction);
        transactions.push(tabularTransaction);
        continue;
      }
      
      // Try to parse as a regular transaction line
      const transaction = this.parseTransactionLine(line);
      if (transaction) {
        console.log(`✅ Parsed regular transaction from line ${i + 1}:`, transaction);
        transactions.push(transaction);
        continue;
      }
      
      console.log(`❌ No transaction found in line ${i + 1}`);
    }
    
    console.log(`📊 Total transactions found: ${transactions.length}`);
    const deduplicatedTransactions = this.deduplicateTransactions(transactions);
    console.log(`📊 Final transactions after deduplication: ${deduplicatedTransactions.length}`);
    
    return deduplicatedTransactions;
  }

  private static parseMultipleTransactionsFromLine(line: string, currentYear: number): RawTransaction[] {
    const transactions: RawTransaction[] = [];
    
    // Pattern to find multiple date-merchant-amount sequences in one line
    const multiPattern = /(\d{1,2}\/\d{1,2}(?:\/\d{4})?)\s+([^0-9-]+?)\s+(-?\d+\.\d{2})/g;
    let match;
    
    while ((match = multiPattern.exec(line)) !== null) {
      const [, dateStr, merchantStr, amountStr] = match;
      
      const date = this.normalizeDate(dateStr, currentYear);
      const merchant = this.cleanMerchantName(merchantStr.trim());
      const amount = parseFloat(amountStr);
      
      if (date && merchant && !isNaN(amount) && merchant.length > 2) {
        transactions.push({ date, merchant, amount });
      }
    }
    
    return transactions;
  }

  private static parseTabularTransaction(line: string, currentYear: number): RawTransaction | null {
    // Try Wells Fargo patterns for single transactions
    for (const pattern of this.wellsFargoPatterns.slice(0, 2)) { // Use only single transaction patterns
      const match = line.match(pattern);
      if (match) {
        const [, dateStr, merchantStr, amountStr] = match;
        
        const date = this.normalizeDate(dateStr, currentYear);
        const merchant = this.cleanMerchantName(merchantStr);
        const amount = parseFloat(amountStr);
        
        if (date && merchant && !isNaN(amount)) {
          return { date, merchant, amount };
        }
      }
    }
    
    // Fallback to extracting components separately
    const dateStr = this.extractDate(line);
    const amountStr = this.extractAmount(line);
    const merchantStr = this.extractMerchant(line, dateStr, amountStr);
    
    if (dateStr && merchantStr && amountStr) {
      const date = this.normalizeDate(dateStr, currentYear);
      const merchant = this.cleanMerchantName(merchantStr);
      const amount = parseFloat(amountStr);
      
      if (date && merchant && !isNaN(amount)) {
        return { date, merchant, amount };
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
        const normalizedDate = this.normalizeDate(date);
        const parsedAmount = parseFloat(amount);
        if (normalizedDate && !isNaN(parsedAmount)) {
          return {
            date: normalizedDate,
            merchant: this.cleanMerchantName(merchant),
            amount: parsedAmount
          };
        }
      }
    } catch (error) {
      // Skip malformed lines
    }
    
    return null;
  }

  private static shouldSkipLine(line: string): boolean {
    return this.skipPatterns.some(pattern => pattern.test(line));
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

  private static extractAmount(line: string): string | null {
    for (const pattern of this.amountPatterns) {
      const match = line.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  private static extractMerchant(line: string, dateStr?: string, amountStr?: string): string | null {
    let merchant = line;
    
    // Remove date from the beginning
    if (dateStr) {
      merchant = merchant.replace(new RegExp('^' + dateStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '').trim();
    }
    
    // Remove amount from the end
    if (amountStr) {
      merchant = merchant.replace(new RegExp(amountStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), '').trim();
    }
    
    // Clean up any remaining artifacts
    merchant = merchant.replace(/\s+/g, ' ').trim();
    
    return merchant.length > 2 ? merchant : null;
  }

  private static cleanMerchantName(merchant: string): string {
    return merchant
      .replace(/\b\d{4,}\b/g, '') // Remove long numbers (transaction IDs)
      .replace(/\b(Check|Ck|#)\s*\d+/gi, '') // Remove check references unless it's the main description
      .replace(/\b(Ref|Reference|ID)[\s:]*\d+/gi, '') // Remove reference numbers
      .replace(/\b(Auth|Authorization)[\s:]*\w+/gi, '') // Remove authorization codes
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s#&.-]/g, '')
      .trim();
  }

  private static normalizeDate(dateStr: string, currentYear: number = 2018): string | null {
    // Handle MM/DD/YYYY format
    const fullDateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (fullDateMatch) {
      const [, month, day, year] = fullDateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Handle MM/DD format (use 2018 for Wells Fargo PDF)
    const shortDateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
    if (shortDateMatch) {
      const [, month, day] = shortDateMatch;
      return `2018-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Handle YYYY-MM-DD format (already normalized)
    const isoDateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoDateMatch) {
      return dateStr;
    }
    
    return null;
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