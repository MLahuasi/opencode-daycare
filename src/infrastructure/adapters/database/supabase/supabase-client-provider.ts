import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnvironment } from "@/config/server";
import type { DatabaseClientProvider } from "../database-client-provider";

/** Creates the server-side Supabase client used by the database adapter. */
export class SupabaseClientProvider
  implements DatabaseClientProvider<SupabaseClient>
{
  /** Creates a Supabase client with the configured project URL and publishable key. */
  createClient(): SupabaseClient {
    const { url, publishableKey } = getSupabaseEnvironment();

    return createClient(url, publishableKey);
  }
}
