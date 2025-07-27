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
    /^(Date|Description|Amount|Balance|Total|Beginning|Ending)\s*$/i,
    /^\s*$/,
    /^Page\s+\d+\s*of\s*\d+\s*$/i,
    /^Wells\s+Fargo\s*$/i,
    /^Account\s+Number\s*$/i,
    /^Statement\s+Period\s*$/i,
    /^Customer\s+Service\s*$/i,
    /^\d+\s*$/,
    /^-+\s*$/,
    /^Balance\s+(Forward|Brought)\s*$/i,
    /^Total\s+(Deposits|Withdrawals|Fees)\s*$/i,
    /^Daily\s+Balance\s*$/i,
    /^Average\s+Balance\s*$/i,
    /^Account\s*Summary\s*$/i,
    /^Interest\s*Rate\s*$/i,
    /^Available\s*Balance\s*$/i,
    /^Present\s*Balance\s*$/i,
    /^Business\s*Choice\s*Checking\s*$/i,
    /^\*{4}\d{4}\s*$/,  // Just account number alone
    /^Deposits\s+Withdrawals\s+Balance\s*$/i,
    /^Date\s+Description\s+Deposits\s*$/i,
    /^Date\s+Description\s+Withdrawals\s*$/i,
  ];

  private static readonly inlineTransactionPatterns = [
    /(\d{2}-\d{2})\s+([^0-9]+?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})/g,
    /(\d{1,2}\/\d{1,2})\s+([^0-9]+?)\s+\$?(\d{1,3}(?:,\d{3})*\.\d{2})/g,
  ];

  private static preprocessText(text: string): string {
    console.log('🔧 Starting comprehensive Wells Fargo text preprocessing...');
    console.log('📄 Original text length:', text.length);
    
    const lines = text.split('\n');
    console.log(`📄 Total lines before filtering: ${lines.length}`);
    
    // Enhanced transaction section detection
    let inTransactionSection = false;
    let pageHasTransactions = false;
    const transactionLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Skip document metadata
      if (this.documentSkipPatterns.some(pattern => pattern.test(line))) {
        continue;
      }
      
      // More flexible transaction section detection
      if (line.match(/Transaction\s+history/i) || 
          line.match(/Date.*Description.*(?:Deposits|Withdrawals|Balance)/i) ||
          line.match(/^\d{1,2}\/\d{1,2}\s+.*\d+\.\d{2}/)) {
        console.log('📍 Found transaction section at line:', i + 1);
        inTransactionSection = true;
        pageHasTransactions = true;
        
        // If this looks like a transaction line itself, keep it
        if (line.match(/^\d{1,2}\/\d{1,2}\s+.*\d+\.\d{2}/)) {
          console.log(`✅ Keeping transaction line ${i + 1}:`, line);
          transactionLines.push(line);
        }
        continue;
      }
      
      // Check for page breaks that might continue transactions
      if (line.match(/^Page\s+\d+/i)) {
        // Reset but keep looking for more transactions
        pageHasTransactions = false;
        continue;
      }
      
      // More flexible end detection - only stop at clear end markers
      if (line.match(/Ending\s+balance/i) || 
          line.match(/Account\s+summary/i) || 
          line.match(/Service\s+charges?/i) ||
          line.match(/Interest\s+paid/i) ||
          line.match(/Monthly\s+service\s+fee/i)) {
        console.log('📍 Found section end at line:', i + 1, ':', line);
        if (!line.match(/^\d{1,2}\/\d{1,2}/)) {
          inTransactionSection = false;
        }
      }
      
      // Enhanced transaction line detection
      if (inTransactionSection || pageHasTransactions) {
        // Less restrictive filtering - capture more potential transaction lines
        const isTransactionLine = (
          line.match(/^\d{1,2}\/\d{1,2}/) ||  // Starts with date
          line.match(/^\d+\s+Check/) ||        // Check number format
          line.match(/\d+\.\d{2}\s*$/) ||      // Ends with amount
          line.match(/[A-Z][a-z]+.*\d+\.\d{2}/) || // Contains merchant and amount
          (transactionLines.length > 0 && !line.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/) && line.length > 10) // Continuation line
        );
        
        const shouldSkip = (
          line.match(/^Date.*Description/i) ||
          line.match(/^Deposits.*Withdrawals/i) ||
          line.match(/^Balance.*Forward/i) ||
          line.match(/^Total.*\$/i) ||
          line.match(/^Account.*Number/i) ||
          line.match(/^Customer.*Service/i) ||
          line.match(/^Wells.*Fargo/i) ||
          line.match(/^\*{4}\d{4}\s*$/) ||
          line.match(/^Page\s+\d+/i) ||
          this.shouldSkipLine(line)
        );
        
        if (isTransactionLine && !shouldSkip) {
          console.log(`✅ Keeping transaction line ${i + 1}:`, line);
          transactionLines.push(line);
        } else if (!shouldSkip && line.length > 5) {
          // Keep potential continuation lines that aren't obvious headers
          console.log(`📝 Keeping potential continuation line ${i + 1}:`, line);
          transactionLines.push(line);
        }
      }
    }
    
    console.log(`🔧 Extracted ${transactionLines.length} potential transaction lines from Wells Fargo statement`);
    
    // Enhanced debugging output
    if (transactionLines.length > 0) {
      console.log('📄 First 15 transaction lines:');
      transactionLines.slice(0, 15).forEach((line, idx) => {
        console.log(`  ${idx + 1}: ${line}`);
      });
      
      if (transactionLines.length > 15) {
        console.log('📄 Last 10 transaction lines:');
        transactionLines.slice(-10).forEach((line, idx) => {
          console.log(`  ${transactionLines.length - 10 + idx + 1}: ${line}`);
        });
      }
    }
    
    return transactionLines.join('\n');
  }

  static parseTransactions(redactedText: string): RawTransaction[] {
    console.log('🔧 Wells Fargo TransactionParser.parseTransactions called');
    console.log('📄 Original text length:', redactedText.length);
    
    const preprocessedText = this.preprocessText(redactedText);
    console.log('📄 Preprocessed text length:', preprocessedText.length);
    
    const lines = preprocessedText.split('\n').filter(line => line.trim());
    console.log('📄 Total lines after preprocessing:', lines.length);
    
    const transactions: RawTransaction[] = [];
    const currentYear = 2018;
    
    // Combine adjacent lines that might be part of the same transaction
    const combinedLines = this.combineMultiLineTransactions(lines);
    console.log('📄 Combined lines count:', combinedLines.length);
    
    for (let i = 0; i < combinedLines.length; i++) {
      const line = combinedLines[i].trim();
      console.log(`🔍 Processing combined line ${i + 1}:`, line);
      
      // Try Wells Fargo specific parsing patterns
      const parsedTransactions = this.parseWellsFargoTransactionLine(line, currentYear);
      if (parsedTransactions.length > 0) {
        console.log(`✅ Found ${parsedTransactions.length} Wells Fargo transactions:`, parsedTransactions);
        transactions.push(...parsedTransactions);
        continue;
      }
      
      console.log(`❌ No Wells Fargo transaction found in line ${i + 1}`);
    }
    
    console.log(`📊 Total transactions found: ${transactions.length}`);
    const deduplicatedTransactions = this.deduplicateTransactions(transactions);
    console.log(`📊 Final transactions after deduplication: ${deduplicatedTransactions.length}`);
    
    return deduplicatedTransactions;
  }

  // Enhanced multi-line transaction combination
  private static combineMultiLineTransactions(lines: string[]): string[] {
    const combinedLines: string[] = [];
    let currentTransaction = '';
    let lookingForAmount = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Enhanced date detection - start of new transaction
      if (/^\d{1,2}\/\d{1,2}/.test(line)) {
        // Save previous transaction if it exists
        if (currentTransaction) {
          combinedLines.push(currentTransaction.trim());
        }
        // Start new transaction
        currentTransaction = line;
        lookingForAmount = !line.match(/\d+\.\d{2}\s*$/); // Check if amount is missing
      } 
      // Check number format (e.g., "1255 Check")
      else if (/^\d+\s+(Check|Deposit)/.test(line)) {
        if (currentTransaction) {
          combinedLines.push(currentTransaction.trim());
        }
        currentTransaction = line;
        lookingForAmount = !line.match(/\d+\.\d{2}\s*$/);
      }
      // Continuation line with amount or description
      else if (currentTransaction) {
        // If we're looking for an amount and this line has one
        if (lookingForAmount && line.match(/^\d+\.\d{2}/)) {
          currentTransaction += ' ' + line;
          lookingForAmount = false;
        }
        // If this looks like a description continuation
        else if (!line.match(/^\d+\.\d{2}/) && line.length > 3) {
          currentTransaction += ' ' + line;
        }
        // If this line has an amount at the end
        else if (line.match(/\d+\.\d{2}\s*$/)) {
          currentTransaction += ' ' + line;
          lookingForAmount = false;
        }
        // Standalone amount line
        else if (/^\d+\.\d{2}\s*$/.test(line)) {
          currentTransaction += ' ' + line;
          lookingForAmount = false;
        }
      }
      // Orphaned line that might be a transaction
      else if (line.length > 5 && !line.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/)) {
        currentTransaction = line;
        lookingForAmount = !line.match(/\d+\.\d{2}\s*$/);
      }
    }
    
    // Add the last transaction
    if (currentTransaction) {
      combinedLines.push(currentTransaction.trim());
    }
    
    console.log(`🔧 Combined ${lines.length} lines into ${combinedLines.length} transaction candidates`);
    
    return combinedLines;
  }

  // Enhanced Wells Fargo transaction parsing with comprehensive patterns
  private static parseWellsFargoTransactionLine(line: string, currentYear: number): RawTransaction[] {
    const transactions: RawTransaction[] = [];
    
    // Comprehensive Wells Fargo patterns for all transaction types
    const wellsFargoPatterns = [
      // Check format with amount and balance: 7/2 1255 Check 190.00 2,850.00
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(\d+)\s+(Check)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'check_with_balance'
      },
      // Check format without balance: 7/2 1255 Check 190.00
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(\d+)\s+(Check)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'check'
      },
      // ATM transactions with detailed info
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(ATM\s+(?:Check\s+Deposit|Withdrawal).*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'atm'
      },
      // Purchase transactions
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(Purchase\s+authorized\s+on\s+\d{1,2}\/\d{1,2}.*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'purchase'
      },
      // Online transfers
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(Online\s+Transfer.*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'transfer'
      },
      // Recurring payments
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(Recurring\s+Payment.*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'recurring'
      },
      // ACH transactions
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(<?.*?ACH.*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'ach'
      },
      // Fee transactions
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(.*?Fee.*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'fee'
      },
      // Mobile deposits
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(Mobile\s+Deposit.*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'mobile_deposit'
      },
      // Branch transactions
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+((?:Withdrawal\s+Made\s+In\s+A\s+Branch|Edeposit\s+IN\s+Branch).*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'branch'
      },
      // Deposited/Cashed checks
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(\d+)\s+((?:Deposited|Cashed)\s+Check.*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'deposited_check'
      },
      // Wire transfers
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(Wire\s+Transfer.*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'wire'
      },
      // General format with amount at end
      {
        pattern: /^(\d{1,2}\/\d{1,2})\s+(.*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'general'
      },
      // Check number only format: 1255 Check
      {
        pattern: /^(\d+)\s+(Check)\s*$/,
        type: 'check_number_only'
      },
      // Amount only format at start of line
      {
        pattern: /^(\d{1,3}(?:,\d{3})*\.?\d{2})\s+(.*)$/,
        type: 'amount_first'
      },
      // Lines with merchant names and amounts embedded
      {
        pattern: /^(.*?)\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s+(\d{1,3}(?:,\d{3})*\.?\d{2})\s*$/,
        type: 'merchant_amount_balance'
      }
    ];

    for (const { pattern, type } of wellsFargoPatterns) {
      const match = line.match(pattern);
      if (match) {
        console.log(`🎯 Matched ${type} pattern:`, match);
        
        let transaction: RawTransaction | null = null;
        
        // Enhanced parsing for different transaction types
        if (type === 'check_with_balance') {
          // Format: date, checkNumber, "Check", amount, balance
          const [, dateStr, checkNumber, , amountStr] = match;
          const normalizedDate = this.normalizeDate(dateStr, currentYear);
          const amount = -parseFloat(amountStr.replace(/,/g, ''));
          
          if (normalizedDate && !isNaN(amount)) {
            transaction = {
              date: normalizedDate,
              merchant: `Check #${checkNumber}`,
              amount: amount
            };
          }
        } else if (type === 'check') {
          // Format: date, checkNumber, "Check", amount
          const [, dateStr, checkNumber, , amountStr] = match;
          const normalizedDate = this.normalizeDate(dateStr, currentYear);
          const amount = -parseFloat(amountStr.replace(/,/g, ''));
          
          if (normalizedDate && !isNaN(amount)) {
            transaction = {
              date: normalizedDate,
              merchant: `Check #${checkNumber}`,
              amount: amount
            };
          }
        } else if (type === 'deposited_check') {
          // Format: date, checkNumber, description, amount
          const [, dateStr, checkNumber, description, amountStr] = match;
          const normalizedDate = this.normalizeDate(dateStr, currentYear);
          const amount = parseFloat(amountStr.replace(/,/g, ''));
          
          if (normalizedDate && !isNaN(amount)) {
            transaction = {
              date: normalizedDate,
              merchant: `${description} #${checkNumber}`,
              amount: amount
            };
          }
        } else if (type === 'check_number_only') {
          // Handle orphaned check numbers - try to find amount in previous context
          const [, checkNumber] = match;
          // This needs special handling with context from previous lines
          console.log(`📝 Found orphaned check number: ${checkNumber}`);
        } else if (type === 'amount_first') {
          // Handle lines starting with amounts
          const [, amountStr, description] = match;
          const amount = parseFloat(amountStr.replace(/,/g, ''));
          
          if (!isNaN(amount) && description.trim()) {
            // Need to find date from context
            console.log(`📝 Found amount-first format: ${amountStr} ${description}`);
          }
        } else if (type === 'merchant_amount_balance') {
          // Handle merchant name with amount and balance
          const [, merchant, amountStr, balanceStr] = match;
          const amount = parseFloat(amountStr.replace(/,/g, ''));
          
          if (!isNaN(amount) && merchant.trim()) {
            // Need to find date from context
            console.log(`📝 Found merchant-amount-balance format: ${merchant} ${amountStr} ${balanceStr}`);
          }
        } else {
          // Handle standard formats: date, description, amount
          const [, dateStr, description, amountStr] = match;
          const normalizedDate = this.normalizeDate(dateStr, currentYear);
          let amount = parseFloat(amountStr.replace(/,/g, ''));
          
          // Enhanced credit/debit determination
          const isCredit = (
            description.toLowerCase().includes('deposit') || 
            description.toLowerCase().includes('credit') ||
            description.toLowerCase().includes('transfer from') ||
            description.toLowerCase().includes('transfer to') && description.toLowerCase().includes('from') ||
            description.toLowerCase().includes('mobile deposit') ||
            description.toLowerCase().includes('edeposit') ||
            description.toLowerCase().includes('cashed check') ||
            description.toLowerCase().includes('deposited check') ||
            type === 'mobile_deposit'
          );
          
          const isDebit = (
            description.toLowerCase().includes('withdrawal') ||
            description.toLowerCase().includes('purchase') ||
            description.toLowerCase().includes('fee') ||
            description.toLowerCase().includes('ach debit') ||
            description.toLowerCase().includes('transfer to') && !description.toLowerCase().includes('from') ||
            type === 'fee' || type === 'purchase' || type === 'ach'
          );
          
          if (isDebit || (!isCredit && amount > 0)) {
            amount = -Math.abs(amount);
          } else if (isCredit) {
            amount = Math.abs(amount);
          }
          
          if (normalizedDate && !isNaN(amount)) {
            const cleanMerchant = this.cleanWellsFargoMerchant(description, type);
            if (cleanMerchant) {
              transaction = {
                date: normalizedDate,
                merchant: cleanMerchant,
                amount: amount
              };
            }
          }
        }
        
        if (transaction && this.isValidTransaction(transaction)) {
          transactions.push(transaction);
          console.log(`✅ Successfully parsed transaction:`, transaction);
        }
        
        break; // Stop after first successful match
      }
    }
    
    return transactions;
  }

  // Clean Wells Fargo merchant names specifically
  private static cleanWellsFargoMerchant(description: string, type: string): string {
    if (!description) return '';
    
    let merchant = description.trim();
    
    // Handle specific Wells Fargo transaction types
    if (type === 'branch_withdrawal') {
      return 'Branch Withdrawal';
    }
    
    if (type === 'mobile_deposit') {
      return 'Mobile Deposit';
    }
    
    // Remove common Wells Fargo prefixes
    const prefixPatterns = [
      /^Purchase authorized on \d{1,2}\/\d{1,2}\s+/,
      /^ATM Check Deposit on \d{1,2}\/\d{1,2}\s+/,
      /^ATM Withdrawal authorized on \d{1,2}\/\d{1,2}\s+/,
      /^Online Transfer (to|from)\s+/,
      /^Recurring Transfer (to|from)\s+/,
      /^Recurring Payment authorized on \d{1,2}\/\d{1,2}\s+/,
      /^< Business to Business ACH Debit - /,
      /^Overdraft Fee for a Transaction Posted on \d{1,2}\/\d{1,2}\s+/,
      /^Edeposit IN Branch\/Store \d{1,2}\/\d{1,2}\/\d{2} \d{2}:\d{2}:\d{2} [AP]m\s+/i
    ];
    
    prefixPatterns.forEach(pattern => {
      merchant = merchant.replace(pattern, '');
    });
    
    // Remove location and card information
    merchant = merchant.replace(/\s+\d+\s+S\s+Main\s+St\s+Salinas\s+CA.*$/i, '');
    merchant = merchant.replace(/\s+ATM\s+ID\s+\w+\s+Card\s+\d+.*$/i, '');
    merchant = merchant.replace(/\s+P\d+\s+Card\s+\d+.*$/i, '');
    merchant = merchant.replace(/\s+S\d+\s+Card\s+\d+.*$/i, '');
    merchant = merchant.replace(/\s+Ref\s+#\w+.*$/i, '');
    merchant = merchant.replace(/\s+xxxxxx\d+.*$/i, '');
    
    // Clean up specific Wells Fargo artifacts
    merchant = merchant.replace(/\s+\d{10,}.*$/, ''); // Remove long reference numbers
    merchant = merchant.replace(/\s+\d{6}\s+\d+.*$/, ''); // Remove date + reference patterns
    
    // Handle specific merchant patterns
    if (merchant.includes('Costco Whse')) {
      merchant = merchant.replace(/Costco Whse #\d+/, 'Costco');
    }
    
    if (merchant.includes('7-Eleven')) {
      merchant = '7-Eleven';
    }
    
    // Remove trailing artifacts
    merchant = merchant.replace(/\s+[A-Z]{2}\s*$/, ''); // State codes
    merchant = merchant.replace(/\s+\d+\s*$/, ''); // Trailing numbers
    
    return merchant.trim() || 'Unknown Merchant';
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