import "server-only";

import {
  getStaffAccount,
  updateStaffAccount,
  type StaffAccountRepository,
} from "@/application/staff";
import { PostgresStaffAccountRepository } from "@/infrastructure/persistence/postgres";
import { getPostgresRuntimeClient } from "../postgres-runtime";

/** Creates the server-side staff account capability. */
export function createStaffAccountComposition() {
  const repository: StaffAccountRepository = new PostgresStaffAccountRepository(
    getPostgresRuntimeClient(),
  );

  return {
    getAccount: (daycareId: string, personId: string) =>
      getStaffAccount(repository, daycareId, personId),
    updateProfile: (
      daycareId: string,
      personId: string,
      input: Parameters<typeof updateStaffAccount>[3],
    ) => updateStaffAccount(repository, daycareId, personId, input),
  };
}
