import type { PersonRoleCode } from "@/domain/person";

/** Persistence capability required to resolve a person's daycare roles. */
export interface PersonRoleReader {
  /**
   * Reads the roles assigned to one person within one daycare.
   *
   * @param personId - Stable person identifier.
   * @param daycareId - Stable daycare identifier.
   * @returns Tenant-scoped role codes in deterministic order.
   */
  findRoles(
    personId: string,
    daycareId: string,
  ): Promise<readonly PersonRoleCode[]>;
}
