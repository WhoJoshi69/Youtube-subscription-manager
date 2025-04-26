import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
});

// Helper function to ensure user is authenticated
export const ensureAuthenticated = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    throw new Error('Not authenticated');
  }
  
  return session;
};

// Initialize the default user if it doesn't exist
export const initializeDefaultUser = async () => {
  const { data: { user }, error } = await supabase.auth.signUp({
    email: 'whojoshi',
    password: 'darshit2002',
  });

  if (error && !error.message.includes('User already registered')) {
    console.error('Error creating default user:', error);
  }
}; 