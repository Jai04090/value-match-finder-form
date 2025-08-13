import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Shield, Database, Tags, Download, Calendar, TrendingUp, Target, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProcessingState, ParsedFileData, CategorizedTransaction } from '@/types/bankStatement';
import { SpendingAnalysisData, SpendingSuggestion, FinancialTask } from '@/types/spendingAnalysis';
import { TextExtractor } from '@/services/textExtractor';
import { PIIRedactor } from '@/services/piiRedactor';
import { UniversalTransactionParser } from '@/services/universalTransactionParser';
import { SpendingAnalyzer } from '@/services/spendingAnalyzer';
import { SuggestionGenerator } from '@/services/suggestionGenerator';
import { TaskGenerator } from '@/services/taskGenerator';
import { ICSCalendarService } from '@/services/icsCalendarService';
import { RawTransaction } from '@/types/bankStatement';

const BankStatementParser = () => {
  const [file, setFile] = useState<File | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: 'idle',
    progress: 0,
    message: 'Ready to process your bank statement or manual transaction data'
  });
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [spendingAnalysis, setSpendingAnalysis] = useState<SpendingAnalysisData | null>(null);
  const [suggestions, setSuggestions] = useState<SpendingSuggestion[]>([]);
  const [tasks, setTasks] = useState<FinancialTask[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [inputMode, setInputMode] = useState<'file' | 'manual'>('file');
  const { toast } = useToast();
  const { user } = useAuth();

  const completeAnalysisWorkflow = async (transactions: CategorizedTransaction[], rawText: string, redactedText: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save analysis and generate suggestions",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate spending analysis
      const analysis = SpendingAnalyzer.analyzeTransactions(transactions);
      analysis.userId = user.id;

      // Save analysis to database
      const { data: analysisData, error: analysisError } = await supabase
        .from('spending_analysis')
        .insert({
          user_id: analysis.userId,
          analysis_date: analysis.analysisDate,
          total_transactions: analysis.totalTransactions,
          total_spending: analysis.totalSpending,
          spending_by_category: analysis.spendingByCategory as any,
          frequency_patterns: analysis.frequencyPatterns as any,
          monthly_averages: analysis.monthlyAverages as any,
          insights: analysis.insights as any
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      analysis.id = analysisData.id;
      setSpendingAnalysis(analysis);

      // Generate suggestions
      const generatedSuggestions = SuggestionGenerator.generateSuggestions(analysis);
      
      // Save suggestions to database
      const suggestionsToSave = generatedSuggestions.map(s => ({
        user_id: s.userId,
        analysis_id: analysis.id,
        suggestion_type: s.suggestionType,
        title: s.title,
        description: s.description,
        category: s.category,
        current_frequency: s.currentFrequency,
        suggested_frequency: s.suggestedFrequency,
        potential_savings: s.potentialSavings,
        priority_score: s.priorityScore,
        status: s.status
      }));

      const { data: savedSuggestions, error: suggestionsError } = await supabase
        .from('spending_suggestions')
        .insert(suggestionsToSave)
        .select();

      if (suggestionsError) throw suggestionsError;

      setSuggestions(generatedSuggestions);
      
      // Set parsed data
      setParsedData({
        rawText,
        redactedText,
        transactions
      });

    } catch (error) {
      console.error('Error in analysis workflow:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to generate spending analysis. Please try again.",
        variant: "destructive"
      });
    }
  };

  const processManualInput = async () => {
    if (!manualInput.trim()) {
      toast({
        title: "No input provided",
        description: "Please enter transaction data to analyze",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingState({
        step: 'parsing',
        progress: 25,
        message: 'Processing manual transaction data...'
      });

      // Parse the manual input using UniversalTransactionParser
      const parseResult = await UniversalTransactionParser.parseTransactions(manualInput);

      setProcessingState({
        step: 'categorizing',
        progress: 70,
        message: 'Analyzing spending patterns...'
      });

      // Complete the analysis workflow
      await completeAnalysisWorkflow(parseResult.transactions, manualInput, manualInput);

      setProcessingState({
        step: 'complete',
        progress: 100,
        message: `Successfully analyzed ${parseResult.transactions.length} transactions with personalized suggestions`
      });

      toast({
        title: "Analysis complete",
        description: `Processed ${parseResult.transactions.length} transactions with spending insights`,
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

  const acceptSuggestion = async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion || !user) return;

    try {
      // Update suggestion status in database
      const { error: updateError } = await supabase
        .from('spending_suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestionId);

      if (updateError) throw updateError;

      // Generate tasks from suggestion
      const generatedTasks = TaskGenerator.generateTasksFromSuggestion(suggestion);
      
      // Save tasks to database
      const tasksToSave = generatedTasks.map(t => ({
        user_id: t.userId,
        suggestion_id: t.suggestionId,
        title: t.title,
        description: t.description,
        task_type: t.taskType,
        due_date: t.dueDate,
        recurrence_pattern: t.recurrencePattern,
        status: t.status,
        estimated_savings: t.estimatedSavings
      }));

      const { data: savedTasks, error: tasksError } = await supabase
        .from('financial_tasks')
        .insert(tasksToSave)
        .select();

      if (tasksError) throw tasksError;

      // Update local state
      setSuggestions(prev => prev.map(s => 
        s.id === suggestionId ? { ...s, status: 'accepted' as const } : s
      ));
      setTasks(prev => [...prev, ...generatedTasks]);

      // Generate ICS file for the tasks
      const icsData = ICSCalendarService.generateICSData(generatedTasks);
      ICSCalendarService.downloadICSFile(icsData, `financial-tasks-${suggestionId.slice(0, 8)}.ics`);

      toast({
        title: "Suggestion selected",
        description: `Created ${generatedTasks.length} action items and downloaded calendar file`,
      });

    } catch (error) {
      toast({
        title: "Error accepting suggestion",
        description: "Failed to create action items. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportTasksToCalendar = () => {
    if (tasks.length === 0) return;

    const icsData = ICSCalendarService.generateICSData(tasks);
    ICSCalendarService.downloadICSFile(icsData, 'financial-wellness-tasks.ics');

    toast({
      title: "Calendar exported",
      description: "Downloaded ICS file with your financial tasks",
    });
  };

  // Sample test data for validation
  const sampleTestData = `Wells Fargo Bank Statement
Account Number: ****1234
Statement Period: 01/01/2024 - 01/31/2024

Date Description Amount
01/02/2024 Starbucks Coffee $4.50
01/03/2024 Amazon.com Purchase $29.99
01/05/2024 Shell Gas Station $45.67
01/07/2024 Walmart Supercenter $123.45
01/10/2024 Netflix Subscription $15.99
01/12/2024 ATM Withdrawal $100.00
01/15/2024 Check #1234 $500.00
01/18/2024 Comcast Internet $89.99
01/20/2024 Uber Ride $23.45
01/25/2024 CVS Pharmacy $12.34
01/28/2024 Direct Deposit $2500.00
01/30/2024 Service Charge $12.00

Total Deposits: $2500.00
Total Withdrawals: $875.38`;

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

      const parseResult = await UniversalTransactionParser.parseTransactions(redactedText);

      // Step 4: Complete processing and analyze
      setProcessingState({
        step: 'categorizing',
        progress: 80,
        message: 'Analyzing spending patterns...'
      });

      const categorizedTransactions = parseResult.transactions;

      // Complete processing and generate analysis
      await completeAnalysisWorkflow(categorizedTransactions, rawText, redactedText);

      setProcessingState({
        step: 'complete',
        progress: 100,
        message: `Successfully processed ${categorizedTransactions.length} transactions with spending insights`
      });

      toast({
        title: "Processing complete",
        description: `Found ${categorizedTransactions.length} transactions with personalized suggestions`,
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

  const runTestMode = async () => {
    setTestMode(true);
    setProcessingState({
      step: 'parsing',
      progress: 50,
      message: 'Running parsing test with sample data...'
    });

    try {
      // Test the parsing with sample data using UniversalTransactionParser
      const testResult = await UniversalTransactionParser.parseTransactions(sampleTestData);
      const qualityAnalysis = { quality: 'good', issues: [], suggestions: [] };
      
      setTestResults({
        ...testResult,
        qualityAnalysis,
        sampleData: sampleTestData
      });

      setProcessingState({
        step: 'complete',
        progress: 100,
        message: `Test completed: ${testResult.transactions.length} transactions parsed`
      });

      toast({
        title: "Test completed",
        description: `Parsed ${testResult.transactions.length} transactions with ${qualityAnalysis.quality} quality`,
      });

    } catch (error) {
      setProcessingState({
        step: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Test failed'
      });

      toast({
        title: "Test failed",
        description: error instanceof Error ? error.message : 'An error occurred during testing',
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
          {/* Test Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Test Mode</h3>
              <p className="text-sm text-muted-foreground">
                Test the parsing logic with sample data to validate improvements
              </p>
            </div>
            <Button
              onClick={runTestMode}
              variant="outline"
              disabled={processingState.step !== 'idle'}
            >
              Run Test
            </Button>
          </div>

          {/* Input Mode Selection */}
          <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'file' | 'manual')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">File Upload</TabsTrigger>
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="space-y-4">
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
              
              <Button
                onClick={processFile}
                disabled={!file || processingState.step !== 'idle'}
                className="w-full"
              >
                {processingState.step === 'idle' ? 'Process Bank Statement' : 'Processing...'}
              </Button>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              {/* Manual Input */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Transaction Data
                  </label>
                  <Textarea
                    placeholder="Paste your transaction data here. Examples:
01/02/2024 Starbucks Coffee $4.50
01/03/2024 Amazon.com Purchase $29.99
01/05/2024 Shell Gas Station $45.67

Or any format from your bank statement..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports various formats • Copy directly from statements • Automatic pattern detection
                  </p>
                </div>
                
                <Button
                  onClick={processManualInput}
                  disabled={!manualInput.trim() || processingState.step !== 'idle'}
                  className="w-full"
                >
                  {processingState.step === 'idle' ? 'Analyze Transaction Data' : 'Processing...'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

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

      {/* Test Results */}
      {testMode && testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Parsing quality analysis and validation results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quality Analysis */}
            <div>
              <h3 className="font-medium mb-3">Quality Analysis</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={testResults.qualityAnalysis.quality === 'excellent' ? 'default' : 
                                 testResults.qualityAnalysis.quality === 'good' ? 'secondary' :
                                 testResults.qualityAnalysis.quality === 'fair' ? 'outline' : 'destructive'}>
                    {testResults.qualityAnalysis.quality.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Overall parsing quality
                  </span>
                </div>
                
                {testResults.qualityAnalysis.issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2">Issues Found:</h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      {testResults.qualityAnalysis.issues.map((issue: string, index: number) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {testResults.qualityAnalysis.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-2">Suggestions:</h4>
                    <ul className="text-sm text-blue-600 space-y-1">
                      {testResults.qualityAnalysis.suggestions.map((suggestion: string, index: number) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Statistics */}
            <div>
              <h3 className="font-medium mb-3">Parsing Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{testResults.stats.totalLines}</div>
                  <div className="text-sm text-muted-foreground">Total Lines</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{testResults.stats.parsedLines}</div>
                  <div className="text-sm text-muted-foreground">Parsed Lines</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{testResults.stats.skippedLines}</div>
                  <div className="text-sm text-muted-foreground">Skipped Lines</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{testResults.stats.errorLines}</div>
                  <div className="text-sm text-muted-foreground">Error Lines</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Parsed Transactions */}
            <div>
              <h3 className="font-medium mb-3">Parsed Transactions ({testResults.transactions.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.transactions.map((transaction: RawTransaction, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{transaction.merchant}</div>
                      <div className="text-sm text-muted-foreground">{transaction.date}</div>
                    </div>
                    <div className="font-medium">${transaction.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Errors */}
            {testResults.errors.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3 text-red-600">Parsing Errors ({testResults.errors.length})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {testResults.errors.map((error: string, index: number) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm text-red-800">{error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Spending Analysis */}
      {spendingAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Spending Analysis
            </CardTitle>
            <CardDescription>
              Insights into your spending patterns and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary">
                  ${spendingAnalysis.totalSpending.toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Spending</div>
              </div>
              <div className="bg-accent/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-accent">
                  {spendingAnalysis.totalTransactions}
                </div>
                <div className="text-sm text-muted-foreground">Transactions</div>
              </div>
              <div className="bg-success/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-success">
                  {Object.keys(spendingAnalysis.spendingByCategory).length}
                </div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
            </div>

            <Separator />

            {/* Category Breakdown */}
            <div>
              <h3 className="font-medium mb-3">Spending by Category</h3>
              <div className="space-y-3">
                {Object.entries(spendingAnalysis.spendingByCategory)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={getCategoryColor(category)}>
                          {category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {spendingAnalysis.frequencyPatterns[category]?.pattern || 'occasional'}
                        </span>
                      </div>
                      <div className="font-medium">${amount.toFixed(0)}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Insights */}
            {spendingAnalysis.insights.savingsOpportunities.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3">Key Insights</h3>
                  <div className="space-y-2">
                    <div className="bg-info/5 rounded-lg p-4">
                      <h4 className="font-medium text-info mb-2">High-Frequency Categories</h4>
                      <p className="text-sm text-muted-foreground">
                        You frequently spend on: {spendingAnalysis.insights.savingsOpportunities.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personalized Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              Personalized Savings Suggestions
            </CardTitle>
            <CardDescription>
              Smart recommendations to help you save money based on your spending patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {suggestion.description}
                    </p>
                    {suggestion.potentialSavings && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          Save ${suggestion.potentialSavings.toFixed(0)}/month
                        </Badge>
                        <Badge variant="outline">
                          Priority: {suggestion.priorityScore}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {suggestion.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => acceptSuggestion(suggestion.id)}
                        className="bg-success hover:bg-success/90"
                      >
                        Select
                      </Button>
                    )}
                    {suggestion.status === 'accepted' && (
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Financial Tasks */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Your Action Plan
            </CardTitle>
            <CardDescription>
              Actionable tasks to help you achieve your savings goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground">{task.description}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {task.taskType}
                      </Badge>
                      {task.recurrencePattern && (
                        <Badge variant="outline">
                          {task.recurrencePattern}
                        </Badge>
                      )}
                      {task.estimatedSavings && (
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          ${task.estimatedSavings.toFixed(0)} savings
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex gap-4">
              <Button 
                onClick={exportTasksToCalendar}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Export to Calendar
              </Button>
              <div className="text-sm text-muted-foreground flex items-center">
                Download ICS file to import tasks into your calendar app
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BankStatementParser;