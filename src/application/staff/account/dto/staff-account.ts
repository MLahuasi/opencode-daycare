/** Tenant-scoped account projection for an authenticated staff member. */
export type StaffAccount = {
  daycareId: string;
  personId: string;
  name: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  roomNames: readonly string[];
};

/** Mutable fields exposed by the staff account form. */
export type UpdateStaffAccountInput = {
  name: string;
  phone: string | null;
};
