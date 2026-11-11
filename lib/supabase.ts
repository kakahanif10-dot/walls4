import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://opunottfkujbdrdcnwqh.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_ob39zZWrEA7CtgeCZnyiTw_0a0TbyRC";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
