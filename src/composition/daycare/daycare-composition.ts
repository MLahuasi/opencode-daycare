import "server-only";

import { getCurrentDaycareId as readCurrentDaycareId } from "@/application/daycare";
import {
  CurrentDaycareProvider,
  PostgresClientProvider,
} from "@/infrastructure/persistence/postgres";

/** Server-only composition for the current operational daycare. */
export function createDaycareComposition() {
  return {
    async getCurrentDaycareId(): Promise<string> {
      const client = new PostgresClientProvider().createClient();

      try {
        return await readCurrentDaycareId(new CurrentDaycareProvider(client));
      } finally {
        await client.end({ timeout: 5 });
      }
    },
  };
}
