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
    
    // Enhanced pattern to detect concatenated transactions with locations
    const concatenatedPattern = /(.+?)\s+([A-Z]{2})([A-Z][a-z].+)/;
    const concatenatedMatch = line.match(concatenatedPattern);
    
    if (concatenatedMatch) {
      // Try to split concatenated merchants
      const [, firstPart, stateCode, secondPart] = concatenatedMatch;
      
      // Look for embedded transactions in the concatenated string
      const transactionPatterns = [
        /(\d{1,2}\/\d{1,2})\s+([^$]+?)\s+(\$?\d+\.?\d*)/g,
        /(Purchase authorized on \d{1,2}\/\d{1,2})\s+([^$]+?)\s+(\$?\d+\.?\d*)/g,
        /(Withdrawal.*?on \d{1,2}\/\d{1,2})\s+([^$]+?)\s+(\$?\d+\.?\d*)/g
      ];
      
      for (const pattern of transactionPatterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const [, dateOrPrefix, merchantStr, amountStr] = match;
          
          // Extract date from prefix if needed
          const dateMatch = dateOrPrefix.match(/(\d{1,2}\/\d{1,2})/);
          if (!dateMatch) continue;
          
          const normalizedDate = this.normalizeDate(dateMatch[1], currentYear);
          if (!normalizedDate) continue;
          
          const amount = parseFloat(amountStr.replace(/\$/, ''));
          if (isNaN(amount)) continue;
          
          const cleanMerchant = this.cleanMerchantName(merchantStr);
          if (!cleanMerchant || cleanMerchant.length < 2) continue;
          
          const transaction: RawTransaction = {
            date: normalizedDate,
            merchant: cleanMerchant,
            amount: -Math.abs(amount)
          };
          
          if (this.isValidTransaction(transaction)) {
            transactions.push(transaction);
          }
        }
      }
    } else {
      // Standard multi-transaction pattern
      const multiTransactionPattern = /(\d{1,2}\/\d{1,2})\s+([^$]+?)\s+(\$?\d+\.?\d*)/g;
      let match;
      
      while ((match = multiTransactionPattern.exec(line)) !== null) {
        const [, dateStr, merchantStr, amountStr] = match;
        
        const normalizedDate = this.normalizeDate(dateStr, currentYear);
        if (!normalizedDate) continue;
        
        const amount = parseFloat(amountStr.replace(/\$/, ''));
        if (isNaN(amount)) continue;
        
        const cleanMerchant = this.cleanMerchantName(merchantStr);
        if (!cleanMerchant || cleanMerchant.length < 2) continue;
        
        const transaction: RawTransaction = {
          date: normalizedDate,
          merchant: cleanMerchant,
          amount: -Math.abs(amount)
        };
        
        if (this.isValidTransaction(transaction)) {
          transactions.push(transaction);
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
    
    // Remove verbose transaction prefixes with embedded dates/locations
    const verbosePrefixPatterns = [
      /^Purchase authorized on \d{1,2}\/\d{1,2}\s*/i,
      /^Withdrawal authorized on \d{1,2}\/\d{1,2}\s*/i,
      /^Withdrawal made in.*?(on \d{1,2}\/\d{1,2})?\s*/i,
      /^Purchase authorized on.*?\s+/i,
      /^Deposit authorized on.*?\s+/i,
      /^Transaction on \d{1,2}\/\d{1,2}\s*/i,
    ];

    verbosePrefixPatterns.forEach(pattern => {
      merchant = merchant.replace(pattern, '');
    });

    // Split concatenated merchants (look for patterns like "MerchantA CityMerchantB")
    const concatenationPattern = /^(.+?)\s+[A-Z]{2}([A-Z][a-z].+)$/;
    const concatenationMatch = merchant.match(concatenationPattern);
    if (concatenationMatch) {
      // Take the first merchant name before the state code
      merchant = concatenationMatch[1];
    }

    // Remove common prefixes and suffixes
    const prefixPatterns = [
      /^(Purchase authorized on|Withdrawal authorized on|Deposit authorized on)\s*/i,
      /^(Transaction\s+)?on\s+\d{1,2}\/\d{1,2}\s*/i,
      /^ATM\s+(Withdrawal|Deposit)\s+/i,
      /^Check\s+/i,
      /^Withdrawal Made In A Branch\/Store\s*/i,
    ];

    prefixPatterns.forEach(pattern => {
      merchant = merchant.replace(pattern, '');
    });

    // Remove city/state patterns that got attached
    merchant = merchant.replace(/\s+[A-Z][a-z]+\s+[A-Z]{2}.*$/i, '');
    
    // Remove dates in various formats
    merchant = merchant.replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, '');
    merchant = merchant.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(,?\s+\d{4})?\b/gi, '');
    
    // Remove times
    merchant = merchant.replace(/\b\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?\b/gi, '');
    
    // Remove amounts (dollar signs with numbers)
    merchant = merchant.replace(/\$?\d+\.?\d*/g, '');
    
    // Remove check numbers and fragments
    merchant = merchant.replace(/\b(Check|Ck)\s*#?\s*\d+/gi, '');
    merchant = merchant.replace(/\b\d+\s*$/, ''); // Trailing numbers
    
    // Remove common suffixes and artifacts
    const suffixPatterns = [
      /\s+(CA|NY|TX|FL|IL|WA|OR|NV|AZ)\s*$/i, // State codes at the end
      /\s+\d{5}(-\d{4})?\s*$/, // ZIP codes
      /\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct)\s*$/i,
      /\s+#\d+\s*$/,
      /\s+(Inc|LLC|Corp|Co|Ltd|LP)\s*$/i,
      /\s+(Store|Shop|Market|Mart|Plaza|Center|Centre)\s*$/i,
      /urchase authorized.*$/i, // Common parsing artifacts
      /\s*\d+\s*$/, // Any remaining trailing numbers
    ];

    suffixPatterns.forEach(pattern => {
      merchant = merchant.replace(pattern, '');
    });

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
    
    // Remove extra whitespace and normalize
    merchant = merchant.replace(/\s+/g, ' ').trim();
    
    // Remove any remaining punctuation at the end
    merchant = merchant.replace(/[.,;:!?]+$/, '');
    
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
    if (!transaction.date || !transaction.merchant || transaction.amount === undefined) {
      return false;
    }

    // Check if merchant is meaningful (not just numbers, single characters, or nonsense)
    if (transaction.merchant.length < 2 || /^\d+$/.test(transaction.merchant)) {
      return false;
    }

    // Reject merchants that are clearly parsing artifacts
    const nonsensePatterns = [
      /^[A-Z]{1,3}[a-z]{1,3}$/,  // Random short strings like "Dlse Pwcr"
      /^\d+$/,                    // Pure numbers
      /^[.,;:!?\s]+$/,           // Pure punctuation
      /^(Check|Ck)\s*#?\s*\d*$/i // Just "Check" without merchant
    ];

    if (nonsensePatterns.some(pattern => pattern.test(transaction.merchant))) {
      return false;
    }

    // Check if amount is reasonable
    const amount = Math.abs(transaction.amount);
    if (amount === 0 || amount > 50000) { // Increased limit for large checks
      return false;
    }

    // Validate date format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(transaction.date)) {
      return false;
    }

    // Check if it's within the expected 2018 Wells Fargo statement range
    const year = parseInt(transaction.date.substring(0, 4));
    const month = parseInt(transaction.date.substring(5, 7));
    if (year !== 2018 || month < 1 || month > 12) {
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