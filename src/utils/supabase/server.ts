import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  'https://trkqknwcicdcsisyjjvl.supabase.co';

const supabaseKey = 
  (typeof process !== 'undefined' && (process.env?.SUPABASE_SECRET_KEY || process.env?.SUPABASE_PUBLISHABLE_KEY || process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
  'sb_publishable_WVKhGcsbkeBo2qvZrAn4Fw_kV305HGv';

export const createClient = () => {
  return createSupabaseClient(
    supabaseUrl,
    supabaseKey
  );
};

export const supabase = createClient();
export default supabase;
