import type { Credential } from "@/domain/auth";
import type { Person, PersonRoleCode } from "@/domain/person";

/** Checks the persisted conditions required before password authentication. */
export function isCredentialLoginEligible(
  person: Person | null,
  credential: Credential | null,
  roles: readonly PersonRoleCode[],
  daycareId: string,
): boolean {
  return Boolean(
    person &&
      credential &&
      person.daycareId === daycareId &&
      credential.daycareId === daycareId &&
      credential.personId === person.id &&
      person.status === "active" &&
      roles.length > 0,
  );
}
