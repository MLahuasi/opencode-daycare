import type { UpdateStaffAccountInput } from "../dto/staff-account";
import type { StaffAccountRepository } from "../ports/staff-account-repository";

/** Updates the fields that staff members are allowed to edit themselves. */
export function updateStaffAccount(
  repository: StaffAccountRepository,
  daycareId: string,
  personId: string,
  input: UpdateStaffAccountInput,
) {
  return repository.updateProfile(daycareId, personId, input);
}
