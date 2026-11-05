import type { Credential } from "@/domain/auth";
import type { Invitation, ParentKid } from "@/domain/family";
import type { Person } from "@/domain/person";

/** Repository views bound to one transaction-scoped database client. */
export type AuthTransactionRepositories = {
  people: {
    findById(daycareId: string, id: string): Promise<Person | null>;
    update(person: Person): Promise<void>;
  };
  credentials: {
    upsert(credential: Credential): Promise<void>;
  };
  invitations: {
    findByCode(daycareId: string, code: string): Promise<Invitation | null>;
    markAccepted(
      daycareId: string,
      id: string,
      acceptedAt: string,
    ): Promise<Invitation | null>;
  };
  parentKids: {
    findByParentAndKid(
      daycareId: string,
      parentId: string,
      kidId: string,
    ): Promise<ParentKid | null>;
    create(parentKid: ParentKid): Promise<void>;
  };
};

/**
 * Transaction boundary required by the Auth acceptance workflow.
 *
 * Infrastructure implementations must execute the complete callback on the
 * same database transaction. The application layer intentionally receives no
 * PostgreSQL client or provider-specific transaction type.
 */
export interface AuthTransactionRunner {
  /**
   * Runs an Auth operation atomically.
   *
   * @param operation - Auth operation whose writes must share one transaction.
   * @returns The operation result after the transaction completes.
   */
  run<T>(
    operation: (repositories?: AuthTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
