-- Check if there are any foreign key constraints on financial_tasks table
-- and remove the problematic constraint if it exists

-- First, check if the constraint exists
DO $$
BEGIN
    -- Remove the foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tasks_suggestion' 
        AND table_name = 'financial_tasks'
    ) THEN
        ALTER TABLE public.financial_tasks DROP CONSTRAINT fk_tasks_suggestion;
        RAISE NOTICE 'Dropped constraint fk_tasks_suggestion';
    END IF;
    
    -- We don't need a foreign key constraint here because suggestions can be deleted
    -- while tasks should remain for historical purposes
END $$;