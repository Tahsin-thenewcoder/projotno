import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niprpguolhmleppurwlx.supabase.co'; // তোর Supabase Project URL
const supabaseAnonKey = 'sb_publishable_9xdfiYJSSoVZh8hAMZCKPw_gtBcyxt4'; // তোর Supabase Anon Key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);