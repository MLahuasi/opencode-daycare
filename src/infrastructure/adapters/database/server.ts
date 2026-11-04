import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseClientProvider } from "./supabase/supabase-client-provider";

let databaseClientInstance: SupabaseClient | undefined;
let initializationPromise: Promise<void> | undefined;

async function initializeDatabaseClient(): Promise<void> {
  if (!databaseClientInstance) {
    const provider = new SupabaseClientProvider();
    databaseClientInstance = provider.createClient();
  }
}

/** Server-only facade for the configured database client lifecycle. */
export const databaseClient = {
  /** Creates and stores the database client once for this server instance. */
  initialize(): Promise<void> {
    initializationPromise ??= initializeDatabaseClient();
    return initializationPromise;
  },
};
