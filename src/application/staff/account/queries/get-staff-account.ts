import type { StaffAccountRepository } from "../ports/staff-account-repository";

/** Reads the account projection for one authenticated staff identity. */
export function getStaffAccount(
  repository: StaffAccountRepository,
  daycareId: string,
  personId: string,
) {
  return repository.findByPerson(daycareId, personId);
}
