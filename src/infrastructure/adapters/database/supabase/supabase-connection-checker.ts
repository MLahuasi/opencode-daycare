import "server-only";

import { getSupabaseEnvironment } from "@/config/server";
import type { DatabaseConnectionChecker } from "@/application/database";

const CONNECTION_TIMEOUT_MS = 5_000;
const READINESS_PROBE_PATH = "/rest/v1/rpc/__opendaycare_readiness_probe__";

/** Checks the availability of the Supabase Data API gateway. */
export class SupabaseConnectionChecker implements DatabaseConnectionChecker {
  /** Performs one GET request against the Data API readiness probe. */
  async check(): Promise<void> {
    const { url, publishableKey } = getSupabaseEnvironment();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT_MS);

    try {
      const response = await fetch(new URL(READINESS_PROBE_PATH, url), {
        method: "GET",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
        signal: controller.signal,
      });

      if (response.status !== 404) {
        throw new Error("Data API readiness probe returned an unexpected response");
      }
    } catch {
      throw new Error("[database] Supabase Data API connection check failed");
    } finally {
      clearTimeout(timeout);
    }
  }
}
