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

  // Document metadata and header skip patterns
  private static readonly documentSkipPatterns: RegExp[] = [
    /Studocu/i,
    /University.*People/i,
    /Corporate\s*Law/i,
    /Downloaded\s*by/i,
    /lOMoARcPSD/i,
    /Scan\s*to\s*open/i,
    /not\s*sponsored/i,
    /endorsed\s*by/i,
    /Business\s*Bank\s*Statement/i,
    /Bank\s*Statements/i,
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
    /^(\d+\.\d{2})\s*$/,
    /^Account\s*Summary/i,
    /^Interest\s*Rate/i,
    /^Available\s*Balance/i,
    /^Present\s*Balance/i,
    /^Business\s*Choice\s*Checking/i,
    /^\*{4}\d{4}\s*$/,  // Just account number alone
    /^purchase\s+authorized\s+on/i,
    /^withdrawal\s+on/i,
    /^deposit\s+on/i,
  ];

  private static readonly inlineTransactionPatterns = [
    /(\d{2}-\d{2})\s+([^0-9]+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})/g,
    /(\d{1,2}\/\d{1,2})\s+([^0-9]+?)\s+\$?(\d{1,3}(?:,\d{3})*\.\d{2})/g,
  ];

  private static preprocessText(text: string): string {
    console.log('🔧 Starting text preprocessing...');
    console.log('📄 Original text sample:', text.substring(0, 300));
    
    // Split into lines and filter early
    const lines = text.split('\n');
    console.log(`📄 Total lines before filtering: ${lines.length}`);
    
    // First pass: Remove document metadata and obvious non-transaction content
    const firstPassLines = lines.filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      
      // Skip document metadata using document skip patterns
      if (this.documentSkipPatterns.some(pattern => pattern.test(trimmed))) {
        console.log('🗑️ Skipping document metadata:', trimmed);
        return false;
      }
      
      return true;
    });
    
    console.log(`📄 After document filter: ${firstPassLines.length} lines`);
    
    // Second pass: Find transaction data sections
    let inTransactionSection = false;
    const transactionLines: string[] = [];
    
    for (const line of firstPassLines) {
      const trimmed = line.trim();
      
      // Check if we're entering a transaction section
      if (this.transactionSectionPatterns.some(pattern => pattern.test(trimmed))) {
        console.log('📍 Found transaction section:', trimmed);
        inTransactionSection = true;
        continue;
      }
      
      // Check if this line has transaction indicators
      const hasDatePattern = /\d{1,2}\/\d{1,2}(\/\d{4})?/.test(trimmed);
      const hasAmountPattern = /\$?\d+\.\d{2}/.test(trimmed);
      const hasAccountPattern = /\*{4}\d{4}/.test(trimmed);
      const hasMerchantIndicators = /(corp|inc|llc|company|store|market|gas|restaurant|bank|atm|check|debit|credit|deposit|withdrawal)/i.test(trimmed);
      const hasTransactionStructure = hasDatePattern && (hasAmountPattern || hasMerchantIndicators);
      
      // Keep lines that look like transactions
      if (hasTransactionStructure || (inTransactionSection && (hasDatePattern || hasAmountPattern))) {
        console.log('✅ Keeping transaction line:', trimmed);
        transactionLines.push(trimmed);
        continue;
      }
      
      // Skip obvious headers and system lines
      if (this.shouldSkipLine(trimmed)) {
        continue;
      }
      
      // Keep lines with substantial content that might contain transaction info
      if (trimmed.length > 15 && (hasDatePattern || hasAmountPattern || hasMerchantIndicators)) {
        console.log('🔍 Keeping potential transaction line:', trimmed);
        transactionLines.push(trimmed);
      }
    }
    
    console.log(`🔧 Filtered from ${lines.length} to ${transactionLines.length} lines`);
    console.log('📄 Sample filtered lines:', transactionLines.slice(0, 10));
    
    return transactionLines.join('\n');
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
    
    // Enhanced pattern to detect multiple transactions with better separation
    // Pattern 1: Multiple date-merchant-amount sequences
    const multiPattern = /(\d{1,2}\/\d{1,2}(?:\/\d{4})?)\s+([^0-9-]+?)\s+(-?\d+\.\d{2})/g;
    let match;
    
    while ((match = multiPattern.exec(line)) !== null) {
      const [, dateStr, merchantStr, amountStr] = match;
      
      const date = this.normalizeDate(dateStr, currentYear);
      const merchant = this.cleanMerchantName(merchantStr.trim());
      const amount = parseFloat(amountStr);
      
      if (this.isValidTransaction({ date, merchant, amount })) {
        transactions.push({ date, merchant, amount });
      }
    }
    
    // Pattern 2: Check for transactions separated by multiple spaces or tabs
    if (transactions.length === 0) {
      const parts = line.split(/\s{3,}|\t+/);
      if (parts.length >= 3) {
        for (let i = 0; i < parts.length - 2; i++) {
          const dateMatch = parts[i].match(/\d{1,2}\/\d{1,2}/);
          const amountMatch = parts[i + 2].match(/([-]?\d+\.\d{2})/);
          
          if (dateMatch && amountMatch) {
            const date = this.normalizeDate(dateMatch[0], currentYear);
            const merchant = this.cleanMerchantName(parts[i + 1]);
            const amount = parseFloat(amountMatch[1]);
            
            if (this.isValidTransaction({ date, merchant, amount })) {
              transactions.push({ date, merchant, amount });
            }
          }
        }
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

  private static cleanMerchantName(rawMerchant: string): string {
    if (!rawMerchant || typeof rawMerchant !== 'string') return '';
    
    let merchant = rawMerchant.trim();
    
    // Remove transaction prefixes with dates/times
    merchant = merchant.replace(/^(purchase\s+authorized\s+on\s+\d{1,2}\/\d{1,2}\s+|withdrawal\s+on\s+\d{1,2}\/\d{1,2}\s+|deposit\s+on\s+\d{1,2}\/\d{1,2}\s+)/i, '');
    merchant = merchant.replace(/^(purchase\s+on\s+\d{4}\s+|withdrawal\s+\d{4}\s+|deposit\s+\d{4}\s+)/i, '');
    
    // Remove embedded dates and times
    merchant = merchant.replace(/\s+\d{1,2}\/\d{1,2}(\/\d{2,4})?\s+/g, ' ');
    merchant = merchant.replace(/\s+\d{4}\s+/g, ' ');
    
    // Remove Wells Fargo specific patterns
    merchant = merchant.replace(/\s*Wells Fargo Bank.*$/i, '');
    merchant = merchant.replace(/\s*WELLS FARGO.*$/i, '');
    merchant = merchant.replace(/\s*WF\s+.*$/i, '');
    
    // Remove state codes, ZIP codes, and trailing location data
    merchant = merchant.replace(/\s+(CA|TX|NY|FL|UT|NV|AZ|WA|OR)\s*\d*\s*$/i, '');
    merchant = merchant.replace(/\s+\d{5}(-\d{4})?\s*$/, ''); // ZIP codes
    
    // Remove trailing amounts and reference numbers
    merchant = merchant.replace(/\s+\d{1,5}\.\d{2}$/, '');
    merchant = merchant.replace(/\s+#?\d+$/, '');
    merchant = merchant.replace(/\s+\d{2,6}$/, ''); // Remove trailing numbers
    
    // Remove fragments like "/2", "/30", ".00"
    merchant = merchant.replace(/\/\d{1,2}$/, '');
    merchant = merchant.replace(/\.\d{2}$/, '');
    
    // Enhanced check formatting
    if (merchant.toLowerCase().includes('check')) {
      const checkMatch = merchant.match(/check\s*[#.]?(\d+)/i);
      if (checkMatch) {
        return `Check #${checkMatch[1]}`;
      }
      // Handle malformed check patterns like "Check.00 24" or "Check300.00 25"
      const malformedCheckMatch = merchant.match(/check\s*\.?\d*\.?\d*\s*(\d+)/i);
      if (malformedCheckMatch) {
        return `Check #${malformedCheckMatch[1]}`;
      }
    }
    
    // Remove PII redaction artifacts that might leak through
    merchant = merchant.replace(/\s*\d+\.\[?REDACTED_[A-Z]+\]?\s*\d*/g, '');
    merchant = merchant.replace(/\s*[A-Z]{2}\s+\d+\.\[?REDACTED_[A-Z]+\]?\s*\d*/g, '');
    
    // Remove any remaining redacted fragments or noise
    merchant = merchant.replace(/\[REDACTED_[A-Z]+\].*$/, '').trim();
    
    // Remove dates in various formats
    merchant = merchant.replace(/\s+\d{1,2}\/\d{1,2}\/?\d{0,4}\s*$/, '');
    merchant = merchant.replace(/\s+\d{1,2}-\d{1,2}-?\d{0,4}\s*$/, '');
    
    // Remove amounts that might have leaked into merchant names
    merchant = merchant.replace(/\s*\$?\d+\.\d{2}\s*$/, '');
    merchant = merchant.replace(/\s*\d+\.\d{2}\s*$/, '');
    
    // Remove common transaction artifacts
    merchant = merchant.replace(/\s*POS\s*$/i, '');
    merchant = merchant.replace(/\s*DEBIT\s*$/i, '');
    merchant = merchant.replace(/\s*CREDIT\s*$/i, '');
    merchant = merchant.replace(/\s*PURCHASE\s*$/i, '');
    merchant = merchant.replace(/\s*WITHDRAWAL\s*$/i, '');
    
    // Remove common bank artifacts
    merchant = merchant.replace(/\s*\d{4,}\s*$/, ''); // Remove trailing account numbers
    merchant = merchant.replace(/\s*REF\s*#?\s*\d+.*$/i, ''); // Remove reference numbers
    merchant = merchant.replace(/\s*TXN\s*#?\s*\d+.*$/i, ''); // Remove transaction numbers
    merchant = merchant.replace(/\s*ID\s*#?\s*\d+.*$/i, ''); // Remove ID numbers
    
    // Remove redundant whitespace and clean up
    merchant = merchant.replace(/\s+/g, ' ').trim();
    
    // Remove leading/trailing non-alphabetic characters except #
    merchant = merchant.replace(/^[^a-zA-Z#]+/, '').replace(/[^a-zA-Z0-9#\s]+$/, '');
    
    // Remove standalone numbers that might be fragments
    if (/^\d+$/.test(merchant)) {
      merchant = '';
    }
    
    return merchant;
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

  private static isValidTransaction(transaction: Partial<RawTransaction>): boolean {
    // Check if transaction has all required fields
    if (!transaction.date || !transaction.merchant || transaction.amount === undefined) {
      return false;
    }
    
    // Validate date format (should be YYYY-MM-DD after normalization)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
      return false;
    }
    
    // Validate date is within 2018 (Wells Fargo PDF constraint)
    const year = parseInt(transaction.date.substring(0, 4));
    if (year !== 2018) {
      return false;
    }
    
    // Enhanced amount validation
    if (isNaN(transaction.amount) || Math.abs(transaction.amount) > 50000 || Math.abs(transaction.amount) < 0.01) {
      return false;
    }
    
    // Enhanced merchant name validation
    const merchantTrimmed = transaction.merchant.trim();
    if (merchantTrimmed.length === 0 || 
        /^\d+\.?\d*$/.test(merchantTrimmed) || // Just numbers
        merchantTrimmed.length < 2 || // Too short
        /^[\d\.\s\/]+$/.test(merchantTrimmed) || // Only digits, dots, spaces, slashes
        merchantTrimmed === 'Check' || // Incomplete check format
        /^[^a-zA-Z]*$/.test(merchantTrimmed)) { // No letters at all
      return false;
    }
    
    return true;
  }

  private static deduplicateTransactions(transactions: RawTransaction[]): RawTransaction[] {
    const seen = new Set<string>();
    const validTransactions = transactions.filter(transaction => {
      // Final quality check before deduplication
      if (!this.isValidTransaction(transaction)) {
        return false;
      }
      
      const key = `${transaction.date}-${transaction.merchant}-${transaction.amount}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    // Sort by date for consistent output
    return validTransactions.sort((a, b) => a.date.localeCompare(b.date));
  }
}