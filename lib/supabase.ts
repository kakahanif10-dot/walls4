"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

let browserClient: SupabaseClient<any> | null = null;

function getBrowserClient() {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}

export const supabase = new Proxy({} as SupabaseClient<any>, {
  get(_target, property) {
    const client = getBrowserClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
