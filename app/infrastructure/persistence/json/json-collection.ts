import "server-only";

import { randomUUID } from "node:crypto";
import { open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";

export type JsonCollectionName =
  | "kids.json"
  | "people.json"
  | "rooms.json"
  | "parent-kids.json";

const JSON_DATA_DIRECTORY = path.join(
  process.cwd(),
  "app",
  "infrastructure",
  "persistence",
  "json",
  "data",
);

let jsonWriteQueue: Promise<void> = Promise.resolve();

/**
 * Reads and parses a JSON collection from the persistence directory.
 *
 * @param fileName - Name of the JSON collection to read.
 * @returns A freshly parsed, immutable list of records.
 * @throws When the file does not contain a JSON array.
 */
export async function readCollection<T>(
  fileName: JsonCollectionName,
): Promise<readonly T[]> {
  const filePath = path.join(JSON_DATA_DIRECTORY, fileName);
  const contents = await readFile(filePath, "utf8");
  const collection: unknown = JSON.parse(contents);

  if (!Array.isArray(collection)) {
    throw new Error(`Expected ${fileName} to contain a JSON array.`);
  }

  return collection as T[];
}

/**
 * Atomically replaces a JSON collection on disk.
 *
 * @param fileName - Name of the JSON collection to replace.
 * @param collection - Records to serialize and persist.
 */
export async function writeCollection<T>(
  fileName: JsonCollectionName,
  collection: readonly T[],
): Promise<void> {
  const filePath = path.join(JSON_DATA_DIRECTORY, fileName);
  const temporaryFilePath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  let temporaryFileCreated = false;

  try {
    const temporaryFile = await open(temporaryFilePath, "wx");
    temporaryFileCreated = true;

    try {
      await temporaryFile.writeFile(`${JSON.stringify(collection, null, 2)}\n`, "utf8");
      await temporaryFile.sync();
    } finally {
      await temporaryFile.close();
    }

    await rename(temporaryFilePath, filePath);
  } finally {
    if (temporaryFileCreated) {
      await rm(temporaryFilePath, { force: true }).catch(() => undefined);
    }
  }
}

/**
 * Serializes a file mutation across the process to avoid lost updates.
 *
 * @param operation - Mutation to run once all previous writes finish.
 * @returns The result of the queued operation.
 */
export function withWriteLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = jsonWriteQueue.then(operation);

  jsonWriteQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
}