import "server-only";

import type { TransactionRunner } from "@/application/family/ports";
import { withJsonTransaction } from "./json-collection";

const FAMILY_AUTH_COLLECTIONS = [
  "credential.json",
  "people.json",
  "parent-kids.json",
  "invitation.json",
] as const;

/** JSON transaction adapter for coordinated Family and Auth writes. */
export class JsonTransactionRunner implements TransactionRunner {
  /**
   * Runs Family and Auth writes with snapshot rollback.
   *
   * @param operation - Async operation whose writes must be coordinated.
   * @returns The operation result after the transaction completes.
   */
  run<T>(operation: () => Promise<T>): Promise<T> {
    return withJsonTransaction(FAMILY_AUTH_COLLECTIONS, operation);
  }
}
