import { RawTransaction } from '@/types/bankStatement';

export class TransactionParser {
  // Enhanced patterns for multiple bank formats
  private static readonly bankPatterns = {
    wellsFargo: [
      /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(-?\d+\.\d{2})$/,
      /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+(-?\d+\.\d{2})$/,
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+([^0-9-]+?)\s+(-?\d+\.\d{2})/g
    ],
    chase: [
      /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+(-?\d+\.\d{2})$/,
      /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(-?\d+\.\d{2})$/,
      /(\d{1,2}\/\d{1,2})\s+([^$]+?)\s+(\$?\d+\.\d{2})/g
    ],
    bankOfAmerica: [
      /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+(-?\d+\.\d{2})$/,
      /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(-?\d+\.\d{2})$/,
      /(\d{1,2}\/\d{1,2})\s+([^$]+?)\s+(\$?\d+\.\d{2})/g
    ],
    citibank: [
      /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+(-?\d+\.\d{2})$/,
      /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(-?\d+\.\d{2})$/,
      /(\d{1,2}\/\d{1,2})\s+([^$]+?)\s+(\$?\d+\.\d{2})/g
    ],
    generic: [
      /^(\d{1,2}\/\d{1,2}(\/\d{4})?)\s+(.+?)\s+(-?\$?\d+\.\d{2})$/,
      /^(\d{1,2}-\d{1,2}(-\d{4})?)\s+(.+?)\s+(-?\$?\d+\.\d{2})$/,
      /(\d{1,2}\/\d{1,2}(\/\d{4})?)\s+([^$]+?)\s+(\$?\d+\.\d{2})/g,
      /(\d{1,2}-\d{1,2}(-\d{4})?)\s+([^$]+?)\s+(\$?\d+\.\d{2})/g
    ]
  };

  private static readonly datePatterns: RegExp[] = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
    /^(\d{1,2})\/(\d{1,2})\b/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})\b/,
    /^(\d{1,2})-(\d{1,2})\b/,
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{1,2})-(\d{1,2})-(\d{4})/
  ];

  private static readonly amountPatterns: RegExp[] = [
    /(-?\$?\d{1,3}(?:,\d{3})*\.\d{2})$/,
    /\s(-?\$?\d{1,3}(?:,\d{3})*\.\d{2})(?:\s|$)/,
    /(-?\$?\d+\.\d{2})$/,
    /\s(-?\$?\d+\.\d{2})(?:\s|$)/,
    /(-?\d+\.\d{2})$/,
    /\s(-?\d+\.\d{2})(?:\s|$)/
  ];

  // Enhanced merchant indicators for better detection
  private static readonly merchantIndicators = [
    // Retail and shopping
    /\b(store|shop|market|mart|plaza|center|centre|mall|outlet|boutique|department|retail)\b/i,
    // Food and dining
    /\b(restaurant|cafe|diner|bistro|grill|pizza|burger|taco|coffee|bakery|deli|bar|pub)\b/i,
    // Gas stations
    /\b(gas|fuel|station|shell|exxon|mobil|chevron|bp|sunoco|76|arco)\b/i,
    // Online retailers
    /\b(amazon|ebay|etsy|walmart|target|costco|best\s*buy|apple|microsoft|google)\b/i,
    // Financial institutions
    /\b(bank|credit\s*union|atm|branch|teller|deposit|withdrawal|transfer)\b/i,
    // Utilities and services
    /\b(comcast|verizon|at&t|tmobile|sprint|electric|water|gas|internet|cable)\b/i,
    // Transportation
    /\b(uber|lyft|taxi|cab|parking|toll|metro|subway|bus|train|airline)\b/i,
    // Healthcare
    /\b(pharmacy|drug|medical|doctor|dentist|hospital|clinic|urgent\s*care)\b/i,
    // Entertainment
    /\b(movie|theater|cinema|concert|show|game|sport|fitness|gym|yoga)\b/i,
    // Education
    /\b(university|college|school|tuition|textbook|course|class)\b/i
  ];

  private static readonly tableHeaderPatterns = [
    /date\s+description\s+amount/i,
    /transaction\s+date\s+description\s+debit\s+credit/i,
    /posting\s+date\s+effective\s+date\s+description\s+amount/i,
    /date\s+transaction\s+description\s+withdrawals\s+deposits\s+balance/i,
    /date\s+description\s+debit\s+credit\s+balance/i,
    /date\s+details\s+amount/i,
    /date\s+payee\s+amount/i
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
    /purchases?/i,
    /withdrawals?/i,
    /transactions?/i,
    /debits?/i,
    /credits?/i
  ];

  // Enhanced document metadata and header skip patterns
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
    /Statement\s*Period/i,
    /Account\s*Summary/i,
    /Page\s+\d+\s+of\s+\d+/i,
    /Confidential/i,
    /Internal\s*Use\s*Only/i
  ];

  private static readonly skipPatterns: RegExp[] = [
    /^(Date|Description|Amount|Balance|Total|Beginning|Ending)/i,
    /^\s*$/,
    /^Page\s+\d+/i,
    /^Wells Fargo|^Chase|^Bank of America|^Citibank/i,
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
    /^\*{4}\d{4}\s*$/,
    /^purchase\s+authorized\s+on/i,
    /^withdrawal\s+on/i,
    /^deposit\s+on/i,
    /^Transaction\s+ID/i,
    /^Reference\s+Number/i,
    /^Memo\s*:/i,
    /^Category\s*:/i
  ];

  private static preprocessText(text: string): string {
    console.log('🔧 Starting enhanced text preprocessing...');
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
    
    // Second pass: Find transaction data sections with enhanced detection
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
      
      // Enhanced transaction detection
      const hasDatePattern = /\d{1,2}[\/\-]\d{1,2}(\/[\/\-]\d{4})?/.test(trimmed);
      const hasAmountPattern = /\$?\d+\.\d{2}/.test(trimmed);
      const hasAccountPattern = /\*{4}\d{4}/.test(trimmed);
      const hasMerchantIndicators = this.merchantIndicators.some(pattern => pattern.test(trimmed));
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
    console.log('🔧 Enhanced TransactionParser.parseTransactions called');
    console.log('📄 Original text length:', redactedText.length);
    console.log('📄 First 500 chars:', redactedText.substring(0, 500));
    
    const preprocessedText = this.preprocessText(redactedText);
    console.log('📄 Preprocessed text length:', preprocessedText.length);
    console.log('📄 Preprocessed first 500 chars:', preprocessedText.substring(0, 500));
    
    const lines = preprocessedText.split('\n').filter(line => line.trim());
    console.log('📄 Total lines after preprocessing:', lines.length);
    console.log('📄 Sample lines:', lines.slice(0, 10));
    
    const transactions: RawTransaction[] = [];
    const currentYear = new Date().getFullYear(); // Use current year as default
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      console.log(`🔍 Processing line ${i + 1}:`, line);
      
      if (this.shouldSkipLine(line)) {
        console.log(`⏭️ Skipping line ${i + 1} (matches skip pattern)`);
        continue;
      }
      
      // Try multiple parsing strategies
      let parsedTransaction: RawTransaction | null = null;
      
      // Strategy 1: Try bank-specific patterns
      parsedTransaction = this.parseWithBankPatterns(line, currentYear);
      
      // Strategy 2: Try generic patterns if bank-specific failed
      if (!parsedTransaction) {
        parsedTransaction = this.parseWithGenericPatterns(line, currentYear);
      }
      
      // Strategy 3: Try component extraction if pattern matching failed
      if (!parsedTransaction) {
        parsedTransaction = this.parseByComponents(line, currentYear);
      }
      
      // Strategy 4: Try multi-transaction parsing
      if (!parsedTransaction) {
        const multiTransactions = this.parseMultipleTransactionsFromLine(line, currentYear);
        if (multiTransactions.length > 0) {
          console.log(`✅ Found ${multiTransactions.length} transactions in line ${i + 1}:`, multiTransactions);
          transactions.push(...multiTransactions);
          continue;
        }
      }
      
      if (parsedTransaction) {
        console.log(`✅ Parsed transaction from line ${i + 1}:`, parsedTransaction);
        transactions.push(parsedTransaction);
      } else {
        console.log(`❌ No transaction found in line ${i + 1}`);
      }
    }
    
    console.log(`📊 Total transactions found: ${transactions.length}`);
    const deduplicatedTransactions = this.deduplicateTransactions(transactions);
    console.log(`📊 Final transactions after deduplication: ${deduplicatedTransactions.length}`);
    
    return deduplicatedTransactions;
  }

  private static parseWithBankPatterns(line: string, currentYear: number): RawTransaction | null {
    // Try all bank patterns
    for (const [bankName, patterns] of Object.entries(this.bankPatterns)) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const [, dateStr, merchantStr, amountStr] = match;
          
          const date = this.normalizeDate(dateStr, currentYear);
          const merchant = this.cleanMerchantName(merchantStr);
          const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
          
          if (date && merchant && !isNaN(amount)) {
            console.log(`✅ Parsed with ${bankName} pattern:`, { date, merchant, amount });
            return { date, merchant, amount };
          }
        }
      }
    }
    
    return null;
  }

  private static parseWithGenericPatterns(line: string, currentYear: number): RawTransaction | null {
    // Enhanced generic pattern matching
    const genericPatterns = [
      /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{4})?)\s+(.+?)\s+(-?\$?\d{1,3}(?:,\d{3})*\.\d{2})$/,
      /^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{4})?)\s+(.+?)\s+(-?\d+\.\d{2})$/,
      /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{4})?)\s+([^$]+?)\s+(\$?\d+\.\d{2})/g
    ];
    
    for (const pattern of genericPatterns) {
      const match = line.match(pattern);
      if (match) {
        const [, dateStr, merchantStr, amountStr] = match;
        
        const date = this.normalizeDate(dateStr, currentYear);
        const merchant = this.cleanMerchantName(merchantStr);
        const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
        
        if (date && merchant && !isNaN(amount)) {
          console.log(`✅ Parsed with generic pattern:`, { date, merchant, amount });
          return { date, merchant, amount };
        }
      }
    }
    
    return null;
  }

  private static parseByComponents(line: string, currentYear: number): RawTransaction | null {
    try {
      const date = this.extractDate(line);
      const amount = this.extractAmount(line);
      const merchant = this.extractMerchant(line, date, amount);

      if (date && amount !== null && merchant) {
        const normalizedDate = this.normalizeDate(date, currentYear);
        const parsedAmount = parseFloat(amount.replace(/[$,]/g, ''));
        if (normalizedDate && !isNaN(parsedAmount)) {
          return {
            date: normalizedDate,
            merchant: this.cleanMerchantName(merchant),
            amount: parsedAmount
          };
        }
      }
    } catch (error) {
      console.log('❌ Component extraction failed:', error);
    }
    
    return null;
  }

  private static parseMultipleTransactionsFromLine(line: string, currentYear: number): RawTransaction[] {
    const transactions: RawTransaction[] = [];
    
    // Enhanced pattern to detect concatenated transactions
    const multiTransactionPatterns = [
      /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{4})?)\s+([^$]+?)\s+(\$?\d+\.?\d*)/g,
      /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{4})?)\s+([^$]+?)\s+(-?\$?\d+\.?\d*)/g,
      /(Purchase authorized on \d{1,2}[\/\-]\d{1,2})\s+([^$]+?)\s+(\$?\d+\.?\d*)/g,
      /(Withdrawal.*?on \d{1,2}[\/\-]\d{1,2})\s+([^$]+?)\s+(\$?\d+\.?\d*)/g
    ];
    
    for (const pattern of multiTransactionPatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const [, dateOrPrefix, merchantStr, amountStr] = match;
        
        // Extract date from prefix if needed
        const dateMatch = dateOrPrefix.match(/(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{4})?)/);
        if (!dateMatch) continue;
        
        const normalizedDate = this.normalizeDate(dateMatch[1], currentYear);
        if (!normalizedDate) continue;
        
        const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
        if (isNaN(amount)) continue;
        
        const cleanMerchant = this.cleanMerchantName(merchantStr);
        if (!cleanMerchant || cleanMerchant.length < 2) continue;
        
        const transaction: RawTransaction = {
          date: normalizedDate,
          merchant: cleanMerchant,
          amount: -Math.abs(amount) // Assume debits for multi-transaction lines
        };
        
        if (this.isValidTransaction(transaction)) {
          transactions.push(transaction);
        }
      }
    }
    
    return transactions;
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
      /^Purchase authorized on \d{1,2}[\/\-]\d{1,2}\s*/i,
      /^Withdrawal authorized on \d{1,2}[\/\-]\d{1,2}\s*/i,
      /^Withdrawal made in.*?(on \d{1,2}[\/\-]\d{1,2})?\s*/i,
      /^Purchase authorized on.*?\s+/i,
      /^Deposit authorized on.*?\s+/i,
      /^Transaction on \d{1,2}[\/\-]\d{1,2}\s*/i,
      /^POS\s+PURCHASE\s*/i,
      /^DEBIT\s+CARD\s+PURCHASE\s*/i,
      /^ATM\s+WITHDRAWAL\s*/i,
      /^CHECK\s+CARD\s+PURCHASE\s*/i
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
      /^(Transaction\s+)?on\s+\d{1,2}[\/\-]\d{1,2}\s*/i,
      /^ATM\s+(Withdrawal|Deposit)\s+/i,
      /^Check\s+/i,
      /^Withdrawal Made In A Branch\/Store\s*/i,
      /^POS\s+PURCHASE\s*/i,
      /^DEBIT\s+CARD\s+PURCHASE\s*/i,
      /^CHECK\s+CARD\s+PURCHASE\s*/i
    ];

    prefixPatterns.forEach(pattern => {
      merchant = merchant.replace(pattern, '');
    });

    // Remove city/state patterns that got attached
    merchant = merchant.replace(/\s+[A-Z][a-z]+\s+[A-Z]{2}.*$/i, '');
    
    // Remove dates in various formats
    merchant = merchant.replace(/\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/g, '');
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
      /\s+(CA|NY|TX|FL|IL|WA|OR|NV|AZ|GA|NC|VA|PA|OH|MI|NJ|MA|CO|TN|MO|IN|LA|KY|SC|AL|OK|CT|UT|IA|MS|AR|KS|WV|NE|ID|HI|NH|ME|RI|MT|DE|SD|ND|AK|VT|WY)\s*$/i, // State codes at the end
      /\s+\d{5}(-\d{4})?\s*$/, // ZIP codes
      /\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl|Circle|Cir)\s*$/i,
      /\s+#\d+\s*$/,
      /\s+(Inc|LLC|Corp|Co|Ltd|LP|LLP|PC|PA)\s*$/i,
      /\s+(Store|Shop|Market|Mart|Plaza|Center|Centre|Mall|Outlet|Boutique)\s*$/i,
      /urchase authorized.*$/i, // Common parsing artifacts
      /\s*\d+\s*$/, // Any remaining trailing numbers
      /\s*POS\s*$/i,
      /\s*DEBIT\s*$/i,
      /\s*CREDIT\s*$/i,
      /\s*PURCHASE\s*$/i,
      /\s*WITHDRAWAL\s*$/i,
      /\s*DEPOSIT\s*$/i
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

  private static normalizeDate(dateStr: string, currentYear: number = new Date().getFullYear()): string | null {
    // Handle MM/DD/YYYY format
    const fullDateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (fullDateMatch) {
      const [, month, day, year] = fullDateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Handle MM/DD format (use current year)
    const shortDateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (shortDateMatch) {
      const [, month, day] = shortDateMatch;
      return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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
    if (amount === 0 || amount > 100000) { // Increased limit for large transactions
      return false;
    }

    // Validate date format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(transaction.date)) {
      return false;
    }

    // Check if it's within a reasonable date range (last 10 years to next year)
    const year = parseInt(transaction.date.substring(0, 4));
    const month = parseInt(transaction.date.substring(5, 7));
    const currentYear = new Date().getFullYear();
    
    if (year < currentYear - 10 || year > currentYear + 1 || month < 1 || month > 12) {
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

  // Test method for validating parsing improvements
  static testParsing(sampleText: string): {
    success: boolean;
    transactions: RawTransaction[];
    errors: string[];
    stats: {
      totalLines: number;
      parsedLines: number;
      skippedLines: number;
      errorLines: number;
    };
  } {
    const errors: string[] = [];
    const stats = {
      totalLines: 0,
      parsedLines: 0,
      skippedLines: 0,
      errorLines: 0
    };

    try {
      console.log('🧪 Starting parsing test...');
      
      const preprocessedText = this.preprocessText(sampleText);
      const lines = preprocessedText.split('\n').filter(line => line.trim());
      stats.totalLines = lines.length;
      
      const transactions: RawTransaction[] = [];
      const currentYear = new Date().getFullYear();
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        try {
          if (this.shouldSkipLine(line)) {
            stats.skippedLines++;
            continue;
          }
          
          // Try multiple parsing strategies
          let parsedTransaction: RawTransaction | null = null;
          
          // Strategy 1: Try bank-specific patterns
          parsedTransaction = this.parseWithBankPatterns(line, currentYear);
          
          // Strategy 2: Try generic patterns if bank-specific failed
          if (!parsedTransaction) {
            parsedTransaction = this.parseWithGenericPatterns(line, currentYear);
          }
          
          // Strategy 3: Try component extraction if pattern matching failed
          if (!parsedTransaction) {
            parsedTransaction = this.parseByComponents(line, currentYear);
          }
          
          // Strategy 4: Try multi-transaction parsing
          if (!parsedTransaction) {
            const multiTransactions = this.parseMultipleTransactionsFromLine(line, currentYear);
            if (multiTransactions.length > 0) {
              transactions.push(...multiTransactions);
              stats.parsedLines += multiTransactions.length;
              continue;
            }
          }
          
          if (parsedTransaction) {
            transactions.push(parsedTransaction);
            stats.parsedLines++;
          } else {
            stats.errorLines++;
            errors.push(`Line ${i + 1}: Could not parse transaction from "${line}"`);
          }
          
        } catch (error) {
          stats.errorLines++;
          errors.push(`Line ${i + 1}: Error parsing "${line}" - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      const deduplicatedTransactions = this.deduplicateTransactions(transactions);
      
      console.log('🧪 Parsing test completed:', {
        totalLines: stats.totalLines,
        parsedLines: stats.parsedLines,
        skippedLines: stats.skippedLines,
        errorLines: stats.errorLines,
        finalTransactions: deduplicatedTransactions.length,
        errors: errors.length
      });
      
      return {
        success: errors.length === 0,
        transactions: deduplicatedTransactions,
        errors,
        stats
      };
      
    } catch (error) {
      errors.push(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        transactions: [],
        errors,
        stats
      };
    }
  }

  // Method to analyze parsing quality
  static analyzeParsingQuality(transactions: RawTransaction[]): {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (transactions.length === 0) {
      return {
        quality: 'poor',
        issues: ['No transactions were parsed'],
        suggestions: ['Check if the input text contains transaction data', 'Verify the text format matches expected patterns']
      };
    }
    
    // Analyze merchant name quality
    const shortMerchants = transactions.filter(t => t.merchant.length < 3);
    if (shortMerchants.length > 0) {
      issues.push(`${shortMerchants.length} transactions have very short merchant names (< 3 characters)`);
      suggestions.push('Consider improving merchant name extraction patterns');
    }
    
    // Analyze amount distribution
    const amounts = transactions.map(t => Math.abs(t.amount));
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const verySmallAmounts = amounts.filter(amt => amt < 1);
    const veryLargeAmounts = amounts.filter(amt => amt > 10000);
    
    if (verySmallAmounts.length > transactions.length * 0.1) {
      issues.push(`${verySmallAmounts.length} transactions have very small amounts (< $1)`);
      suggestions.push('Review amount parsing patterns for small transactions');
    }
    
    if (veryLargeAmounts.length > transactions.length * 0.05) {
      issues.push(`${veryLargeAmounts.length} transactions have very large amounts (> $10,000)`);
      suggestions.push('Verify large amount parsing accuracy');
    }
    
    // Analyze date consistency
    const dates = transactions.map(t => new Date(t.date));
    const invalidDates = dates.filter(d => isNaN(d.getTime()));
    if (invalidDates.length > 0) {
      issues.push(`${invalidDates.length} transactions have invalid dates`);
      suggestions.push('Improve date parsing and validation');
    }
    
    // Analyze merchant name patterns
    const suspiciousMerchants = transactions.filter(t => 
      /^\d+$/.test(t.merchant) || // Pure numbers
      /^[A-Z]{1,3}[a-z]{1,3}$/.test(t.merchant) || // Random short strings
      /^[.,;:!?\s]+$/.test(t.merchant) // Pure punctuation
    );
    
    if (suspiciousMerchants.length > transactions.length * 0.1) {
      issues.push(`${suspiciousMerchants.length} transactions have suspicious merchant names`);
      suggestions.push('Improve merchant name cleaning and validation');
    }
    
    // Determine overall quality
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    
    if (issues.length === 0) {
      quality = 'excellent';
    } else if (issues.length <= 2) {
      quality = 'good';
    } else if (issues.length <= 4) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }
    
    return { quality, issues, suggestions };
  }
}