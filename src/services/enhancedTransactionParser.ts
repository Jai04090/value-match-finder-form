import { RawTransaction } from '@/types/bankStatement';
import { EnhancedPatternMatcher, ParsedLine, MultiLineTransaction } from './enhancedPatternMatcher';

export interface EnhancedParseResult {
  transactions: RawTransaction[];
  metadata: {
    totalLines: number;
    processedLines: number;
    skippedLines: number;
    successfulExtractions: number;
    detectedLocale: string;
    detectedFormat: string;
    multiLineTransactions: number;
    csvTransactions: number;
    tabularTransactions: number;
  };
}

export class EnhancedTransactionParser {
  private static readonly NOISE_PATTERNS = [
    /^(Date|Description|Amount|Balance|Total|Beginning|Ending|Account|Statement)/i,
    /^(Wells Fargo|Bank of America|Chase|Citi|US Bank)/i,
    /^Page\s+\d+/i,
    /^\s*$/,
    /^-+\s*$/,
    /^\d+\s*$/,
    /^Balance\s+(Forward|Brought)/i,
    /^Total\s+(Deposits|Withdrawals|Fees)/i,
    /^(Daily|Average)\s+Balance/i,
    /^\$?\d+\.\d{2}\s*$/,
    /^Interest\s*Rate/i,
    /^Available\s*Balance/i,
    /^Account\s*Summary/i,
    /^\*{4}\d{4}\s*$/,
    /^Customer\s+Service/i,
    /^Statement\s+Period/i,
    /^Account\s+Number/i,
    /^Routing\s+Number/i,
    /^[A-Z\s]+:\s*$/,
    /^www\./i,
    /^\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{4}\s*$/
  ];

  static parseTransactions(text: string): EnhancedParseResult {
    console.log('🚀 Starting enhanced transaction parsing...');
    
    const locale = EnhancedPatternMatcher.detectLocale(text);
    const format = EnhancedPatternMatcher.detectFormat(text);
    
    console.log(`🌍 Detected locale: ${locale}, format: ${format}`);
    
    const preprocessedText = this.preprocessText(text);
    const lines = preprocessedText.split('\n').filter(line => line.trim());
    
    console.log(`📄 Processing ${lines.length} lines`);
    
    let transactions: RawTransaction[] = [];
    let processedLines = 0;
    let skippedLines = 0;
    let successfulExtractions = 0;
    let multiLineTransactions = 0;
    let csvTransactions = 0;
    let tabularTransactions = 0;
    
    // Strategy 1: Handle CSV/TSV format
    if (format === 'CSV' || format === 'TSV' || format === 'MIXED') {
      const csvResults = this.parseCSVFormat(lines, format);
      transactions.push(...csvResults);
      csvTransactions = csvResults.length;
      console.log(`📊 CSV/TSV parsing found ${csvResults.length} transactions`);
    }
    
    // Strategy 2: Handle multi-line transactions
    const multiLineResults = this.parseMultiLineTransactions(lines, locale);
    transactions.push(...multiLineResults);
    multiLineTransactions = multiLineResults.length;
    console.log(`📋 Multi-line parsing found ${multiLineResults.length} transactions`);
    
    // Strategy 3: Standard line-by-line parsing
    const currentYear = this.detectYear(text);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      processedLines++;
      
      if (this.shouldSkipLine(line)) {
        skippedLines++;
        continue;
      }
      
      // Skip if already processed in multi-line or CSV
      if (this.isAlreadyProcessed(line, transactions)) {
        continue;
      }
      
      const parsedTransaction = this.parseSingleLine(line, locale, currentYear);
      if (parsedTransaction) {
        transactions.push(parsedTransaction);
        successfulExtractions++;
        tabularTransactions++;
        console.log(`✅ Parsed: ${parsedTransaction.date} | ${parsedTransaction.merchant} | $${parsedTransaction.amount}`);
      }
    }
    
    // Final cleanup and deduplication
    const finalTransactions = this.deduplicateAndClean(transactions);
    
    console.log(`📊 Final results: ${finalTransactions.length} transactions from ${transactions.length} raw extractions`);
    
    return {
      transactions: finalTransactions,
      metadata: {
        totalLines: lines.length,
        processedLines,
        skippedLines,
        successfulExtractions: finalTransactions.length,
        detectedLocale: locale,
        detectedFormat: format,
        multiLineTransactions,
        csvTransactions,
        tabularTransactions
      }
    };
  }

  private static preprocessText(text: string): string {
    console.log('🔧 Enhanced preprocessing...');
    
    // Remove common document headers and footers
    const lines = text.split('\n');
    const cleanedLines: string[] = [];
    
    let inStatementData = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      // Skip obvious noise
      if (this.shouldSkipLine(trimmed)) continue;
      
      // Look for start of transaction data
      if (!inStatementData) {
        const transactionIndicators = [
          /transaction/i,
          /activity/i,
          /deposits/i,
          /withdrawals/i,
          /purchases/i,
          /date.*description.*amount/i,
          /\d{1,2}\/\d{1,2}.*\$\d+/i
        ];
        
        if (transactionIndicators.some(pattern => pattern.test(trimmed))) {
          inStatementData = true;
        }
      }
      
      // Keep lines that look like transactions or are in transaction section
      if (inStatementData || this.looksLikeTransaction(trimmed)) {
        cleanedLines.push(trimmed);
      }
    }
    
    console.log(`🔧 Preprocessed from ${lines.length} to ${cleanedLines.length} lines`);
    return cleanedLines.join('\n');
  }

  private static parseCSVFormat(lines: string[], format: string): RawTransaction[] {
    const transactions: RawTransaction[] = [];
    const delimiter = format === 'TSV' ? '\t' : this.detectCSVDelimiter(lines);
    
    let headers: string[] | undefined;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Detect headers
      if (i === 0 || (!headers && /date.*description.*amount/i.test(line))) {
        headers = line.split(delimiter).map(h => h.trim().toLowerCase());
        continue;
      }
      
      const parsed = EnhancedPatternMatcher.parseCSVLine(line, delimiter, headers);
      if (parsed && parsed.date && parsed.merchant && parsed.amount !== null) {
        const normalizedDate = this.normalizeDate(parsed.date);
        if (normalizedDate) {
          transactions.push({
            date: normalizedDate,
            merchant: this.cleanMerchant(parsed.merchant),
            amount: parsed.amount
          });
        }
      }
    }
    
    return transactions;
  }

  private static parseMultiLineTransactions(lines: string[], locale: string): RawTransaction[] {
    const transactions: RawTransaction[] = [];
    const multiLines = EnhancedPatternMatcher.detectMultiLineTransactions(lines);
    
    for (const multiLine of multiLines) {
      const combinedLine = multiLine.lines.join(' ').trim();
      const dateStr = EnhancedPatternMatcher.extractDateComponents(combinedLine, locale as any);
      const amountStr = EnhancedPatternMatcher.extractAmountComponents(combinedLine, locale as any);
      const merchantStr = EnhancedPatternMatcher.extractMerchantFromLine(combinedLine, dateStr || undefined, amountStr || undefined);
      
      if (dateStr && amountStr && merchantStr) {
        const normalizedDate = this.normalizeDate(dateStr);
        const amount = EnhancedPatternMatcher.parseAmountWithLocale(amountStr, locale as any);
        
        if (normalizedDate && amount !== null) {
          transactions.push({
            date: normalizedDate,
            merchant: this.cleanMerchant(merchantStr),
            amount
          });
        }
      }
    }
    
    return transactions;
  }

  private static parseSingleLine(line: string, locale: string, currentYear: number): RawTransaction | null {
    const dateStr = EnhancedPatternMatcher.extractDateComponents(line, locale as any);
    const amountStr = EnhancedPatternMatcher.extractAmountComponents(line, locale as any);
    const merchantStr = EnhancedPatternMatcher.extractMerchantFromLine(line, dateStr || undefined, amountStr || undefined);
    
    if (!dateStr || !amountStr || !merchantStr) {
      return null;
    }
    
    const normalizedDate = this.normalizeDate(dateStr, currentYear);
    const amount = EnhancedPatternMatcher.parseAmountWithLocale(amountStr, locale as any);
    
    if (!normalizedDate || amount === null) {
      return null;
    }
    
    return {
      date: normalizedDate,
      merchant: this.cleanMerchant(merchantStr),
      amount
    };
  }

  private static detectCSVDelimiter(lines: string[]): string {
    const delimiters = [',', ';', '\t', '|'];
    const sampleLines = lines.slice(0, 10);
    
    let bestDelimiter = ',';
    let maxScore = 0;
    
    for (const delimiter of delimiters) {
      let score = 0;
      for (const line of sampleLines) {
        const parts = line.split(delimiter);
        if (parts.length >= 3 && parts.length <= 10) {
          score += parts.length;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestDelimiter = delimiter;
      }
    }
    
    return bestDelimiter;
  }

  private static detectYear(text: string): number {
    const yearMatches = text.match(/20\d{2}/g);
    if (yearMatches) {
      return parseInt(yearMatches[yearMatches.length - 1]);
    }
    return new Date().getFullYear();
  }

  private static normalizeDate(dateStr: string, currentYear: number = new Date().getFullYear()): string | null {
    if (!dateStr) return null;
    
    // Try various date formats
    const patterns = [
      { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, order: [1, 2, 3] }, // YYYY-MM-DD
      { regex: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, order: [3, 1, 2] }, // MM/DD/YYYY
      { regex: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/, order: [3, 1, 2], century: true }, // MM/DD/YY
      { regex: /^(\d{1,2})[\/\-](\d{1,2})$/, order: [currentYear, 1, 2], useCurrentYear: true } // MM/DD
    ];
    
    for (const pattern of patterns) {
      const match = dateStr.match(pattern.regex);
      if (match) {
        let year = pattern.useCurrentYear ? currentYear : parseInt(match[pattern.order[0] as number]);
        let month = parseInt(match[pattern.order[1] as number]);
        let day = parseInt(match[pattern.order[2] as number]);
        
        if (pattern.century && year < 100) {
          year += 2000;
        }
        
        // Validate date
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
    }
    
    return null;
  }

  private static cleanMerchant(merchant: string): string {
    if (!merchant) return '';
    
    let cleaned = merchant.trim();
    
    // Remove common artifacts
    const cleaningPatterns = [
      /^(Purchase authorized on|Withdrawal authorized on|Transaction on)\s*/i,
      /^ATM\s+(Withdrawal|Deposit)\s*/i,
      /^Check\s*#?\s*/i,
      /\s+[A-Z]{2}\s*\d{5}.*$/i,
      /\s+\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\s*/g,
      /\s+[\$€£¥₹]\d+.*$/i,
      /\s{2,}/g
    ];
    
    cleaningPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, ' ');
    });
    
    return cleaned.trim();
  }

  private static shouldSkipLine(line: string): boolean {
    return this.NOISE_PATTERNS.some(pattern => pattern.test(line));
  }

  private static looksLikeTransaction(line: string): boolean {
    const hasDate = /\d{1,2}[\/\-]\d{1,2}/.test(line);
    const hasAmount = /[\$€£¥₹]?\d+([.,]\d{2})?/.test(line);
    const hasText = /[a-zA-Z]{3,}/.test(line);
    
    return (hasDate && hasAmount) || (hasDate && hasText) || (hasAmount && hasText && line.length > 20);
  }

  private static isAlreadyProcessed(line: string, transactions: RawTransaction[]): boolean {
    const lineWords = line.toLowerCase().split(/\s+/);
    return transactions.some(t => {
      const merchantWords = t.merchant.toLowerCase().split(/\s+/);
      const overlap = lineWords.filter(word => merchantWords.includes(word)).length;
      return overlap > merchantWords.length * 0.7;
    });
  }

  private static deduplicateAndClean(transactions: RawTransaction[]): RawTransaction[] {
    const seen = new Map<string, RawTransaction>();
    
    for (const transaction of transactions) {
      // Validate transaction
      if (!transaction.date || !transaction.merchant || transaction.amount === null || 
          transaction.merchant.length < 2 || Math.abs(transaction.amount) > 1000000) {
        continue;
      }
      
      const key = `${transaction.date}_${transaction.merchant.toLowerCase().trim()}_${transaction.amount.toFixed(2)}`;
      
      if (!seen.has(key)) {
        seen.set(key, {
          date: transaction.date,
          merchant: this.cleanMerchant(transaction.merchant),
          amount: Number(transaction.amount.toFixed(2))
        });
      }
    }
    
    return Array.from(seen.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
