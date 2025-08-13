import { RawTransaction, CategorizedTransaction } from '@/types/bankStatement';
import { BankDetector } from './bankDetector';
import { EnhancedTransactionParser } from './enhancedTransactionParser';
import { DynamicCategorizer } from './dynamicCategorizer';

export interface UniversalParsingResult {
  transactions: CategorizedTransaction[];
  metadata: {
    bankName: string;
    extractionConfidence: number;
    totalTransactions: number;
    processingStats: {
      totalLines: number;
      processedLines: number;
      successfulExtractions: number;
      detectedLocale: string;
      detectedFormat: string;
      multiLineTransactions: number;
      csvTransactions: number;
      tabularTransactions: number;
    };
    categoryDistribution: Record<string, number>;
  };
}

export class UniversalTransactionParser {
  static async parseTransactions(
    text: string,
    options: {
      useMLFeatures?: boolean;
      customKeywordMap?: Record<string, string[]>;
      minConfidenceThreshold?: number;
    } = {}
  ): Promise<UniversalParsingResult> {
    console.log('🚀 Starting enhanced universal transaction parsing...');
    
    const {
      useMLFeatures = true,
      customKeywordMap,
      minConfidenceThreshold = 0.4
    } = options;
    
    try {
      // Step 1: Detect bank and get profile
      console.log('🏦 Step 1: Bank Detection');
      const bankProfile = BankDetector.detectBank(text);
      console.log(`✅ Detected bank: ${bankProfile.name}`);
      
      // Step 2: Enhanced transaction extraction
      console.log('🔍 Step 2: Enhanced Transaction Extraction');
      const extractionResult = EnhancedTransactionParser.parseTransactions(text);
      console.log(`✅ Extracted ${extractionResult.transactions.length} transactions`);
      console.log(`📊 Processing stats:`, extractionResult.metadata);
      
      // Step 3: Dynamic categorization
      console.log('🏷️ Step 3: Transaction Categorization');
      const categorizedTransactions = DynamicCategorizer.categorizeTransactions(
        extractionResult.transactions,
        customKeywordMap,
        useMLFeatures
      );
      console.log(`✅ Categorized ${categorizedTransactions.length} transactions`);
      
      // Step 4: Generate metadata and statistics
      const categoryDistribution = DynamicCategorizer.getCategoryStats(categorizedTransactions);
      
      const result: UniversalParsingResult = {
        transactions: categorizedTransactions,
        metadata: {
          bankName: bankProfile.name,
          extractionConfidence: Math.min(0.95, extractionResult.metadata.successfulExtractions / Math.max(1, extractionResult.metadata.processedLines)),
          totalTransactions: categorizedTransactions.length,
          processingStats: {
            totalLines: extractionResult.metadata.totalLines,
            processedLines: extractionResult.metadata.processedLines,
            successfulExtractions: extractionResult.metadata.successfulExtractions,
            detectedLocale: extractionResult.metadata.detectedLocale,
            detectedFormat: extractionResult.metadata.detectedFormat,
            multiLineTransactions: extractionResult.metadata.multiLineTransactions,
            csvTransactions: extractionResult.metadata.csvTransactions,
            tabularTransactions: extractionResult.metadata.tabularTransactions
          },
          categoryDistribution
        }
      };
      
      console.log('🎉 Enhanced universal parsing complete!');
      console.log('📊 Final Results:', {
        bank: bankProfile.name,
        transactions: categorizedTransactions.length,
        locale: extractionResult.metadata.detectedLocale,
        format: extractionResult.metadata.detectedFormat,
        categories: Object.keys(categoryDistribution).filter(cat => categoryDistribution[cat] > 0).length
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Enhanced universal parsing failed:', error);
      throw new Error(`Enhanced universal transaction parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static validateTransactions(transactions: RawTransaction[]): RawTransaction[] {
    return transactions.filter(transaction => {
      // Basic validation rules
      if (!transaction.date || !transaction.merchant || transaction.amount === null || transaction.amount === undefined) {
        return false;
      }
      
      if (transaction.merchant.length < 2) {
        return false;
      }
      
      if (Math.abs(transaction.amount) > 1000000) { // $1M sanity check
        return false;
      }
      
      // Date validation
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(transaction.date)) {
        return false;
      }
      
      return true;
    });
  }

  static mergeDuplicateTransactions(transactions: RawTransaction[]): RawTransaction[] {
    const seen = new Map<string, RawTransaction>();
    
    for (const transaction of transactions) {
      const key = `${transaction.date}_${transaction.merchant.toLowerCase().trim()}_${transaction.amount}`;
      
      if (!seen.has(key)) {
        seen.set(key, transaction);
      } else {
        // If we find a duplicate, keep the one with more detailed merchant info
        const existing = seen.get(key)!;
        if (transaction.merchant.length > existing.merchant.length) {
          seen.set(key, transaction);
        }
      }
    }
    
    return Array.from(seen.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  static generateProcessingReport(result: UniversalParsingResult): string {
    const { metadata } = result;
    const successRate = ((metadata.processingStats.successfulExtractions / metadata.processingStats.processedLines) * 100).toFixed(1);
    const topCategories = Object.entries(metadata.categoryDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ');
    
    return `
📊 ENHANCED UNIVERSAL PARSER REPORT
====================================
Bank: ${metadata.bankName}
Total Transactions: ${metadata.totalTransactions}
Detected Locale: ${metadata.processingStats.detectedLocale}
Detected Format: ${metadata.processingStats.detectedFormat}

📈 Processing Stats:
- Lines Processed: ${metadata.processingStats.processedLines}
- Successful Extractions: ${metadata.processingStats.successfulExtractions}
- Multi-line Transactions: ${metadata.processingStats.multiLineTransactions}
- CSV Transactions: ${metadata.processingStats.csvTransactions}
- Tabular Transactions: ${metadata.processingStats.tabularTransactions}
- Success Rate: ${successRate}%

🏷️ Categorization:
- Top Categories: ${topCategories}
- Category Coverage: ${Object.keys(metadata.categoryDistribution).filter(cat => metadata.categoryDistribution[cat] > 0).length}/8 categories

🎯 Quality Metrics:
- Extraction Quality: ${metadata.extractionConfidence >= 0.8 ? 'Excellent' : metadata.extractionConfidence >= 0.6 ? 'Good' : 'Fair'}
- Data Completeness: ${successRate}%
    `;
  }
}
