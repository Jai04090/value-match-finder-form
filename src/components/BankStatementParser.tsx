import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, Shield, Database, Tags, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProcessingState, ParsedFileData, CategorizedTransaction } from '@/types/bankStatement';
import { TextExtractor } from '@/services/textExtractor';
import { PIIRedactor } from '@/services/piiRedactor';
import { UniversalTransactionParser } from '@/services/universalTransactionParser';

const BankStatementParser = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: 'idle',
    progress: 0,
    message: 'Ready to process your bank statement'
  });
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      const fileName = selectedFile.name.toLowerCase();
      
      if ((fileType === 'application/pdf' || fileName.endsWith('.pdf')) ||
          (fileType === 'text/csv' || fileName.endsWith('.csv'))) {
        setFile(selectedFile);
        setParsedData(null);
        setProcessingState({
          step: 'idle',
          progress: 0,
          message: `Selected: ${selectedFile.name}`
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF or CSV file",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const input = document.createElement('input');
      input.type = 'file';
      input.files = event.dataTransfer.files;
      handleFileSelect({ target: input } as any);
    }
  }, [handleFileSelect]);

  const processFile = async () => {
    if (!file) return;

    try {
      // Step 1: Extract text
      setProcessingState({
        step: 'extracting',
        progress: 20,
        message: 'Extracting text from file...'
      });

      const rawText = await TextExtractor.extractText(file);

      // Step 2: Redact PII
      setProcessingState({
        step: 'redacting',
        progress: 40,
        message: 'Redacting sensitive information...'
      });

      const redactedText = PIIRedactor.redactPII(rawText);

      // Step 3: Parse transactions
      setProcessingState({
        step: 'parsing',
        progress: 60,
        message: 'Parsing transaction data...'
      });

      // Step 3: Universal parsing and categorization
      setProcessingState({
        step: 'parsing',
        progress: 70,
        message: 'Analyzing transactions with universal parser...'
      });

      const parsingResult = await UniversalTransactionParser.parseTransactions(redactedText, {
        useMLFeatures: true,
        minConfidenceThreshold: 0.3
      });

      setProcessingState({
        step: 'categorizing',
        progress: 90,
        message: 'Finalizing categorization...'
      });

      const categorizedTransactions = parsingResult.transactions;

      // Complete
      setProcessingState({
        step: 'complete',
        progress: 100,
        message: `Successfully processed ${categorizedTransactions.length} transactions`
      });

      setParsedData({
        rawText,
        redactedText,
        transactions: categorizedTransactions
      });

      toast({
        title: "Processing complete",
        description: `Found ${categorizedTransactions.length} transactions from ${parsingResult.metadata.bankName}`,
      });

    } catch (error) {
      setProcessingState({
        step: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'An error occurred during processing'
      });

      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      });
    }
  };

  const downloadResults = () => {
    if (!parsedData) return;

    const dataToDownload = {
      summary: {
        totalTransactions: parsedData.transactions.length,
        categories: parsedData.transactions.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        processedAt: new Date().toISOString(),
        processingMetadata: {
          parsingEngine: 'Universal Parser v2.0'
        }
      },
      transactions: parsedData.transactions
    };

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank-statement-parsed-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Food: 'bg-green-100 text-green-800',
      Retail: 'bg-blue-100 text-blue-800',
      Subscriptions: 'bg-purple-100 text-purple-800',
      Other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.Other;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Bank Statement Parser
          </CardTitle>
          <CardDescription>
            Upload a PDF or CSV bank statement from any major bank. Our universal parser automatically detects the format and extracts transactions with high accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-4 hover:border-muted-foreground/50 transition-colors relative">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative"
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Drop your bank statement here</p>
                <p className="text-sm text-muted-foreground">or click to browse files</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports any bank format • PDF and CSV files • Universal parsing engine • All processing happens locally
              </p>
              <input
                type="file"
                accept=".pdf,.csv"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Selected: <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </AlertDescription>
            </Alert>
          )}

          {/* Processing Status */}
          {processingState.step !== 'idle' && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{processingState.message}</span>
                    <span className="text-sm text-muted-foreground">{processingState.progress}%</span>
                  </div>
                  <Progress value={processingState.progress} />
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Extract
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Redact PII
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      Parse Data
                    </div>
                    <div className="flex items-center gap-1">
                      <Tags className="h-3 w-3" />
                      Categorize
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={processFile}
              disabled={!file || processingState.step === 'extracting' || processingState.step === 'redacting' || processingState.step === 'parsing' || processingState.step === 'categorizing'}
              className="flex-1"
            >
              {processingState.step === 'idle' ? 'Process Bank Statement' : 'Processing...'}
            </Button>
            
            {parsedData && (
              <Button
                onClick={downloadResults}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
            <CardDescription>
              Found {parsedData.transactions.length} transactions with categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Summary */}
            <div>
              <h3 className="font-medium mb-3">Category Summary</h3>
            <div className="flex flex-wrap gap-2">
                {Object.entries(parsedData.transactions.reduce((acc, t) => {
                  acc[t.category] = (acc[t.category] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)).map(([category, count]) => (
                  <Badge key={category} variant="secondary" className={getCategoryColor(category)}>
                    {category}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Transaction List */}
            <div>
              <h3 className="font-medium mb-3">Transactions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {parsedData.transactions.slice(0, 50).map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{transaction.merchant}</div>
                      <div className="text-sm text-muted-foreground">{transaction.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={getCategoryColor(transaction.category)}>
                        {transaction.category}
                      </Badge>
                      <div className="font-medium">${transaction.amount.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                {parsedData.transactions.length > 50 && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    ... and {parsedData.transactions.length - 50} more transactions
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BankStatementParser;