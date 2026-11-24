import type {
  StaffAccount,
  UpdateStaffAccountInput,
} from "../dto/staff-account";

/** Persistence port for the authenticated staff account. */
export interface StaffAccountRepository {
  /** Reads one account within its tenant and person identity. */
  findByPerson(daycareId: string, personId: string): Promise<StaffAccount | null>;

  /** Updates only the mutable profile fields exposed to the staff member. */
  updateProfile(
    daycareId: string,
    personId: string,
    input: UpdateStaffAccountInput,
  ): Promise<void>;
}
