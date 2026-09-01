import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ==============================================================================
// Substitua pelas credenciais do seu projeto no Supabase (https://supabase.com)
// Settings -> API -> Project URL & Project API Keys (anon public)
// ==============================================================================

export const SUPABASE_URL: string = 'https://dktqxuhnyqorpthhcakd.supabase.co';
export const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrdHF4dWhueXFvcnB0aGhjYWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMDY5NjksImV4cCI6MjEwMzc4Mjk2OX0.pB0na5Z9KGqNBOSXEx-zCwXes2-yVm8nBM29LG8m2QA';

// Verifica se o usuário já preencheu as credenciais reais
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    SUPABASE_URL !== 'https://SEU_PROJETO.supabase.co' &&
    SUPABASE_ANON_KEY !== 'SUA_CHAVE_ANON_PUBLICA' &&
    SUPABASE_URL.startsWith('https://')
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
