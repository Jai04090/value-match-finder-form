import { RawTransaction } from '@/types/bankStatement';
import { BankProfile } from './bankDetector';
import { UniversalPatternEngine, PatternConfig } from './universalPatternEngine';

export interface ExtractionResult {
  transactions: RawTransaction[];
  confidence: number;
  metadata: {
    totalLines: number;
    processedLines: number;
    skippedLines: number;
    successfulExtractions: number;
    averageConfidence: number;
  };
}

export class IntelligentTransactionExtractor {
  private static readonly MIN_CONFIDENCE_THRESHOLD = 0.4;
  private static readonly MIN_MERCHANT_LENGTH = 2;
  private static readonly MAX_AMOUNT = 1000000; // $1M max for sanity check

  static extractTransactions(
    text: string, 
    bankProfile: BankProfile
  ): ExtractionResult {
    console.log(`🔍 Starting intelligent extraction for ${bankProfile.name}`);
    
    const config = UniversalPatternEngine.generatePatternConfig(bankProfile);
    const preprocessedText = this.preprocessText(text, config);
    const lines = preprocessedText.split('\n').filter(line => line.trim());
    
    console.log(`📊 Processing ${lines.length} lines`);
    
    const transactions: RawTransaction[] = [];
    const confidenceScores: number[] = [];
    let processedLines = 0;
    let skippedLines = 0;
    let successfulExtractions = 0;
    
    let currentYear = this.detectStatementYear(text);
    let inTransactionSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      processedLines++;
      
      if (UniversalPatternEngine.shouldSkipLine(line, config)) {
        skippedLines++;
        continue;
      }
      
      // Check if we're entering a transaction section
      if (UniversalPatternEngine.isTransactionSection(line, config)) {
        console.log(`📍 Entering transaction section: ${line}`);
        inTransactionSection = true;
        continue;
      }
      
      // Try multiple extraction strategies
      const extractionResults = [
        this.extractWithPatterns(line, config, currentYear),
        this.extractWithContextualParsing(line, lines, i, config, currentYear),
        this.extractWithFuzzyMatching(line, config, currentYear)
      ];
      
      // Take the result with highest confidence
      const bestResult = extractionResults
        .filter(result => result !== null)
        .sort((a, b) => b!.confidence - a!.confidence)[0];
      
      if (bestResult && bestResult.confidence >= this.MIN_CONFIDENCE_THRESHOLD) {
        const transaction = this.validateAndCleanTransaction(bestResult.transaction);
        if (transaction) {
          transactions.push(transaction);
          confidenceScores.push(bestResult.confidence);
          successfulExtractions++;
          console.log(`✅ Extracted: ${transaction.date} | ${transaction.merchant} | $${transaction.amount}`);
        }
      }
    }
    
    // Deduplicate and sort transactions
    const finalTransactions = this.deduplicateTransactions(transactions);
    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length 
      : 0;
    
    console.log(`📊 Extraction complete: ${finalTransactions.length} transactions (${successfulExtractions} raw extractions)`);
    
    return {
      transactions: finalTransactions,
      confidence: averageConfidence,
      metadata: {
        totalLines: lines.length,
        processedLines,
        skippedLines,
        successfulExtractions,
        averageConfidence
      }
    };
  }

  private static extractWithPatterns(
    line: string, 
    config: PatternConfig, 
    currentYear: number
  ): { transaction: RawTransaction; confidence: number } | null {
    const components = UniversalPatternEngine.extractComponents(line, config);
    
    if (!components.date || !components.merchant || !components.amount) {
      return null;
    }
    
    const normalizedDate = this.normalizeDate(components.date, currentYear);
    const cleanMerchant = this.cleanMerchantName(components.merchant);
    const parsedAmount = this.parseAmount(components.amount);
    
    if (!normalizedDate || !cleanMerchant || parsedAmount === null) {
      return null;
    }
    
    return {
      transaction: {
        date: normalizedDate,
        merchant: cleanMerchant,
        amount: parsedAmount
      },
      confidence: components.confidence
    };
  }

  private static extractWithContextualParsing(
    line: string,
    allLines: string[],
    lineIndex: number,
    config: PatternConfig,
    currentYear: number
  ): { transaction: RawTransaction; confidence: number } | null {
    // Look at surrounding lines for context
    const contextLines = [];
    for (let i = Math.max(0, lineIndex - 2); i <= Math.min(allLines.length - 1, lineIndex + 2); i++) {
      if (i !== lineIndex) {
        contextLines.push(allLines[i]);
      }
    }
    
    // Try to extract from current line with enhanced context
    const components = UniversalPatternEngine.extractComponents(line, config);
    let confidence = components.confidence;
    
    // If we're missing components, try to find them in context
    if (!components.date && contextLines.some(l => /\d{1,2}\/\d{1,2}/.test(l))) {
      confidence -= 0.2; // Penalize for missing date
    }
    
    if (!components.amount && contextLines.some(l => /\$?\d+\.?\d*/.test(l))) {
      confidence -= 0.3; // Penalize for missing amount
    }
    
    if (confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      return null;
    }
    
    return this.extractWithPatterns(line, config, currentYear);
  }

  private static extractWithFuzzyMatching(
    line: string,
    config: PatternConfig,
    currentYear: number
  ): { transaction: RawTransaction; confidence: number } | null {
    // Implement fuzzy matching for partial or malformed transactions
    let date: string | null = null;
    let merchant: string | null = null;
    let amount: string | null = null;
    let confidence = 0;
    
    // Fuzzy date extraction
    const dateMatch = line.match(/\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?/);
    if (dateMatch) {
      date = dateMatch[0];
      confidence += 0.25;
    }
    
    // Fuzzy amount extraction (look for any number with 2 decimals or dollar sign)
    const amountMatches = line.match(/[\$]?\d{1,6}(?:,\d{3})*(?:\.\d{2})?/g);
    if (amountMatches && amountMatches.length > 0) {
      // Take the most likely amount (often the last one)
      amount = amountMatches[amountMatches.length - 1];
      confidence += 0.3;
    }
    
    // Fuzzy merchant extraction (text between date and amount)
    if (date && amount) {
      const dateIndex = line.indexOf(date);
      const amountIndex = line.lastIndexOf(amount);
      
      if (dateIndex < amountIndex) {
        const merchantText = line.substring(dateIndex + date.length, amountIndex).trim();
        if (merchantText.length >= this.MIN_MERCHANT_LENGTH) {
          merchant = merchantText;
          confidence += 0.25;
        }
      }
    }
    
    if (!date || !merchant || !amount || confidence < this.MIN_CONFIDENCE_THRESHOLD) {
      return null;
    }
    
    const normalizedDate = this.normalizeDate(date, currentYear);
    const cleanMerchant = this.cleanMerchantName(merchant);
    const parsedAmount = this.parseAmount(amount);
    
    if (!normalizedDate || !cleanMerchant || parsedAmount === null) {
      return null;
    }
    
    return {
      transaction: {
        date: normalizedDate,
        merchant: cleanMerchant,
        amount: parsedAmount
      },
      confidence: confidence * 0.8 // Reduce confidence for fuzzy matching
    };
  }

  private static preprocessText(text: string, config: PatternConfig): string {
    console.log('🔧 Preprocessing text for intelligent extraction...');
    
    const lines = text.split('\n');
    const filteredLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed || UniversalPatternEngine.shouldSkipLine(trimmed, config)) {
        continue;
      }
      
      // Keep lines that have transaction indicators
      const hasDate = /\d{1,2}[\/\-]\d{1,2}/.test(trimmed);
      const hasAmount = /[\$]?\d+(?:\.\d{2})?/.test(trimmed);
      const hasText = /[a-zA-Z]{3,}/.test(trimmed);
      
      if (hasDate || hasAmount || hasText) {
        filteredLines.push(trimmed);
      }
    }
    
    console.log(`🔧 Filtered from ${lines.length} to ${filteredLines.length} lines`);
    return filteredLines.join('\n');
  }

  private static detectStatementYear(text: string): number {
    // Look for year patterns in the first 1000 characters
    const yearMatches = text.substring(0, 1000).match(/20\d{2}/g);
    if (yearMatches) {
      return parseInt(yearMatches[yearMatches.length - 1]);
    }
    
    // Default to current year if not found
    return new Date().getFullYear();
  }

  private static normalizeDate(dateStr: string, currentYear: number): string | null {
    if (!dateStr) return null;
    
    // Handle various date formats
    const patterns = [
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: 'MM/DD/YYYY' },
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, format: 'MM/DD/YY' },
      { regex: /^(\d{1,2})\/(\d{1,2})$/, format: 'MM/DD' },
      { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, format: 'YYYY-MM-DD' },
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, format: 'MM-DD-YYYY' }
    ];
    
    for (const pattern of patterns) {
      const match = dateStr.match(pattern.regex);
      if (match) {
        let year: number, month: number, day: number;
        
        switch (pattern.format) {
          case 'MM/DD/YYYY':
          case 'MM-DD-YYYY':
            [, month, day, year] = match.map(Number);
            break;
          case 'MM/DD/YY':
            [, month, day] = match.map(Number);
            year = 2000 + Number(match[3]);
            break;
          case 'MM/DD':
            [, month, day] = match.map(Number);
            year = currentYear;
            break;
          case 'YYYY-MM-DD':
            [, year, month, day] = match.map(Number);
            break;
          default:
            continue;
        }
        
        // Validate date components
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
    }
    
    return null;
  }

  private static parseAmount(amountStr: string): number | null {
    if (!amountStr) return null;
    
    // Clean the amount string
    const cleaned = amountStr.replace(/[\$,\s]/g, '');
    const amount = parseFloat(cleaned);
    
    if (isNaN(amount) || amount > this.MAX_AMOUNT) {
      return null;
    }
    
    return amount;
  }

  private static cleanMerchantName(merchant: string): string {
    if (!merchant) return '';
    
    let cleaned = merchant.trim();
    
    // Remove common prefixes and artifacts
    const cleaningPatterns = [
      /^(Purchase authorized on|Withdrawal authorized on|Transaction on)\s*/i,
      /^ATM\s+(Withdrawal|Deposit)\s*/i,
      /^Check\s*#?\s*/i,
      /\s+[A-Z]{2}\s*\d{5}.*$/i, // Remove state and zip
      /\s+\d{1,2}\/\d{1,2}(\/\d{2,4})?\s*/g, // Remove embedded dates
      /\s+\$\d+.*$/i, // Remove embedded amounts
      /\s{2,}/g // Collapse multiple spaces
    ];
    
    cleaningPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, ' ');
    });
    
    return cleaned.trim();
  }

  private static validateAndCleanTransaction(transaction: RawTransaction): RawTransaction | null {
    // Validate transaction components
    if (!transaction.date || !transaction.merchant || transaction.amount === null || transaction.amount === undefined) {
      return null;
    }
    
    if (transaction.merchant.length < this.MIN_MERCHANT_LENGTH) {
      return null;
    }
    
    if (Math.abs(transaction.amount) > this.MAX_AMOUNT) {
      return null;
    }
    
    // Clean and format the transaction
    return {
      date: transaction.date,
      merchant: this.cleanMerchantName(transaction.merchant),
      amount: Number(transaction.amount.toFixed(2))
    };
  }

  private static deduplicateTransactions(transactions: RawTransaction[]): RawTransaction[] {
    const seen = new Set<string>();
    const unique: RawTransaction[] = [];
    
    for (const transaction of transactions) {
      const key = `${transaction.date}_${transaction.merchant}_${transaction.amount}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(transaction);
      }
    }
    
    // Sort by date
    return unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
