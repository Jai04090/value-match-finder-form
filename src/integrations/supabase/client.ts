
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = 'https://vldqiteuwzvwfhfoyiel.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsZHFpdGV1d3p2d2ZoZm95aWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4Njk0OTYsImV4cCI6MjA2NjQ0NTQ5Nn0.aSfHV0GCruB3YS5utCFUBfJrm5MUu-3cUFKqTU9tw_A'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
