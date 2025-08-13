-- Create table for spending analysis data
CREATE TABLE public.spending_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_spending DECIMAL(10,2) NOT NULL DEFAULT 0,
  spending_by_category JSONB NOT NULL DEFAULT '{}',
  frequency_patterns JSONB NOT NULL DEFAULT '{}',
  monthly_averages JSONB NOT NULL DEFAULT '{}',
  insights JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for personalized spending suggestions
CREATE TABLE public.spending_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  current_frequency TEXT,
  suggested_frequency TEXT,
  potential_savings DECIMAL(10,2),
  priority_score INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for financial tasks generated from suggestions
CREATE TABLE public.financial_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suggestion_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'habit',
  due_date TIMESTAMP WITH TIME ZONE,
  recurrence_pattern TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_savings DECIMAL(10,2),
  actual_savings DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for calendar integration
CREATE TABLE public.task_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  event_title TEXT NOT NULL,
  event_description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  ics_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.spending_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spending_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for spending_analysis
CREATE POLICY "Users can view their own spending analysis" 
ON public.spending_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own spending analysis" 
ON public.spending_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spending analysis" 
ON public.spending_analysis 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for spending_suggestions
CREATE POLICY "Users can view their own suggestions" 
ON public.spending_suggestions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suggestions" 
ON public.spending_suggestions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions" 
ON public.spending_suggestions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for financial_tasks
CREATE POLICY "Users can manage their own tasks" 
ON public.financial_tasks 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for task_calendar_events
CREATE POLICY "Users can manage their own calendar events" 
ON public.task_calendar_events 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create foreign key relationships
ALTER TABLE public.spending_suggestions 
ADD CONSTRAINT fk_suggestions_analysis 
FOREIGN KEY (analysis_id) REFERENCES public.spending_analysis(id) ON DELETE CASCADE;

ALTER TABLE public.financial_tasks 
ADD CONSTRAINT fk_tasks_suggestion 
FOREIGN KEY (suggestion_id) REFERENCES public.spending_suggestions(id) ON DELETE SET NULL;

ALTER TABLE public.task_calendar_events 
ADD CONSTRAINT fk_events_task 
FOREIGN KEY (task_id) REFERENCES public.financial_tasks(id) ON DELETE CASCADE;

-- Create triggers for updated_at columns
CREATE TRIGGER update_spending_analysis_updated_at
BEFORE UPDATE ON public.spending_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spending_suggestions_updated_at
BEFORE UPDATE ON public.spending_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_tasks_updated_at
BEFORE UPDATE ON public.financial_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();