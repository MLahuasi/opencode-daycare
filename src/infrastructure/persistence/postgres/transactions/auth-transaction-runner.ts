import "server-only";

import type {
  AuthTransactionRepositories,
  AuthTransactionRunner,
} from "@/application/auth";
import { PostgresCredentialRepository } from "../repositories/credential-repository";
import { PostgresInvitationRepository } from "../repositories/invitation-repository";
import { PostgresParentKidRepository } from "../repositories/parent-kid-repository";
import { PostgresPersonRepository } from "../repositories/person-repository";
import type { PostgresClient } from "../client/postgres-client";

/** Runs Auth acceptance operations against one PostgreSQL transaction. */
export class PostgresAuthTransactionRunner implements AuthTransactionRunner {
  public constructor(private readonly client: PostgresClient) {}

  async run<T>(
    operation: (repositories: AuthTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    return this.client.begin(async (transaction) => {
      const repositories: AuthTransactionRepositories = {
        people: new PostgresPersonRepository(transaction),
        credentials: new PostgresCredentialRepository(transaction),
        invitations: new PostgresInvitationRepository(transaction),
        parentKids: new PostgresParentKidRepository(transaction),
      };

      return operation(repositories);
    });
  }
}
