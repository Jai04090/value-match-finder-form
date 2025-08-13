import { RawTransaction, CategorizedTransaction } from '@/types/bankStatement';
import { BankDetector } from './bankDetector';
import { IntelligentTransactionExtractor } from './intelligentTransactionExtractor';
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
    console.log('🚀 Starting LENIENT universal transaction parsing...');
    
    const {
      useMLFeatures = true,
      customKeywordMap,
      minConfidenceThreshold = 0.2 // LOWERED from 0.4
    } = options;
    
    try {
      // Step 1: Detect bank and get profile
      console.log('🏦 Step 1: Bank Detection');
      const bankProfile = BankDetector.detectBank(text);
      console.log(`✅ Detected bank: ${bankProfile.name}`);
      
      // Step 2: Intelligent transaction extraction
      console.log('🔍 Step 2: LENIENT Transaction Extraction');
      const extractionResult = IntelligentTransactionExtractor.extractTransactions(text, bankProfile);
      console.log(`✅ Extracted ${extractionResult.transactions.length} transactions with ${(extractionResult.confidence * 100).toFixed(1)}% confidence`);
      
      // Filter by confidence threshold - MORE LENIENT
      const qualityTransactions = extractionResult.transactions.filter((_, index) => {
        // Since we don't have individual confidence scores, use overall confidence
        return extractionResult.confidence >= minConfidenceThreshold;
      });
      
      console.log(`📊 After confidence filtering: ${qualityTransactions.length} transactions (threshold: ${minConfidenceThreshold})`);
      
      // Step 3: Dynamic categorization
      console.log('🏷️ Step 3: Transaction Categorization');
      const categorizedTransactions = DynamicCategorizer.categorizeTransactions(
        qualityTransactions,
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
          extractionConfidence: extractionResult.confidence,
          totalTransactions: categorizedTransactions.length,
          processingStats: {
            totalLines: extractionResult.metadata.totalLines,
            processedLines: extractionResult.metadata.processedLines,
            successfulExtractions: extractionResult.metadata.successfulExtractions
          },
          categoryDistribution
        }
      };
      
      console.log('🎉 LENIENT universal parsing complete!');
      console.log('📊 Results:', {
        bank: bankProfile.name,
        transactions: categorizedTransactions.length,
        confidence: `${(extractionResult.confidence * 100).toFixed(1)}%`,
        categories: Object.keys(categoryDistribution).filter(cat => categoryDistribution[cat] > 0).length
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Universal parsing failed:', error);
      throw new Error(`Universal transaction parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static validateTransactions(transactions: RawTransaction[]): RawTransaction[] {
    return transactions.filter(transaction => {
      // MUCH MORE LENIENT validation rules
      if (!transaction.date || !transaction.merchant || transaction.amount === null || transaction.amount === undefined) {
        return false;
      }
      
      if (transaction.merchant.length < 1) { // Reduced from 2
        return false;
      }
      
      if (Math.abs(transaction.amount) > 10000000) { // Increased from $1M to $10M
        return false;
      }
      
      // MORE LENIENT date validation
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
📊 LENIENT UNIVERSAL PARSER REPORT
================================
Bank: ${metadata.bankName}
Total Transactions: ${metadata.totalTransactions}
Extraction Confidence: ${(metadata.extractionConfidence * 100).toFixed(1)}%
Success Rate: ${successRate}%

📈 Processing Stats:
- Lines Processed: ${metadata.processingStats.processedLines}
- Successful Extractions: ${metadata.processingStats.successfulExtractions}
- Top Categories: ${topCategories}

🎯 Quality Metrics:
- Extraction Quality: ${metadata.extractionConfidence >= 0.6 ? 'Excellent' : metadata.extractionConfidence >= 0.4 ? 'Good' : 'Fair'} (LENIENT SCALE)
- Data Completeness: ${successRate}%
- Category Coverage: ${Object.keys(metadata.categoryDistribution).filter(cat => metadata.categoryDistribution[cat] > 0).length}/8 categories

💡 LENIENT MODE: Accepting more transactions to ensure comprehensive extraction
    `;
  }
}
