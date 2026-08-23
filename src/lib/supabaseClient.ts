import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || 
  'https://trkqknwcicdcsisyjjvl.supabase.co';

const supabaseKey = (typeof process !== 'undefined' && (process.env?.SUPABASE_SECRET_KEY || process.env?.SUPABASE_PUBLISHABLE_KEY)) || 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
  'sb_publishable_WVKhGcsbkeBo2qvZrAn4Fw_kV305HGv';

export const supabase = createClient(supabaseUrl, supabaseKey);

export function getSupabaseClient() {
  return supabase;
}

export default supabase;
