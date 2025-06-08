import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Only create client if we have real values (not placeholders)
export const supabase = supabaseUrl.includes('placeholder') || supabaseAnonKey === 'placeholder-key'
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)