// lib/supabase.js

import { createClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = "https://dabyuhvubsvmfgiosxoj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhYnl1aHZ1YnN2bWZnaW9zeG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MDg0NDksImV4cCI6MjA0MDk4NDQ0OX0.nNkK3fN4MyssB5P118PNeAYr4Yxo6KpYLV4IanJ1Jv4";

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
