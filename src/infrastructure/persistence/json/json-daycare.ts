import "server-only";

import { getApplicationEnvironment } from "@/config/server";
import type { DaycareScoped } from "@/domain/daycare";
import {
  CurrentDaycareProvider,
  PostgresClientProvider,
} from "../postgres";
import type { JsonCollectionName } from "./json-collection";
import { readCollection } from "./json-collection";

let daycareIdPromise: Promise<string> | undefined;
const JSON_BUILD_DAYCARE_ID = "112b5f27-b108-4c96-912d-560abf06ae0d";

async function getJsonDaycareId(): Promise<string> {
  if (getApplicationEnvironment().isBuild) {
    return JSON_BUILD_DAYCARE_ID;
  }

  daycareIdPromise ??= (async () => {
    const client = new PostgresClientProvider().createClient();

    try {
      return await new CurrentDaycareProvider(client).getCurrentDaycareId();
    } finally {
      await client.end({ timeout: 5 });
    }
  })();

  try {
    return await daycareIdPromise;
  } catch (error) {
    daycareIdPromise = undefined;
    throw error;
  }
}

/** Reads a JSON snapshot and enriches its records only in memory. */
export async function readDaycareScopedCollection<
  TEntity extends DaycareScoped,
>(fileName: JsonCollectionName): Promise<readonly TEntity[]> {
  const [records, daycareId] = await Promise.all([
    readCollection<Omit<TEntity, "daycareId">>(fileName),
    getJsonDaycareId(),
  ]);

  return records.map((record) => ({ ...record, daycareId }) as TEntity);
}

/** Removes the tenant field before writing a domain record to a JSON snapshot. */
export function toJsonRecord<TEntity extends DaycareScoped>(
  entity: TEntity,
): Omit<TEntity, "daycareId"> {
  const record = { ...entity };
  Reflect.deleteProperty(record, "daycareId");
  return record as Omit<TEntity, "daycareId">;
}
