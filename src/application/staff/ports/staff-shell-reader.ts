/** Persisted Staff Shell data resolved for one person and daycare. */
export type StaffShellRecord = {
  brandName: string;
  personName: string;
  jobTitle: string | null;
  roomNames: readonly string[];
};

/** Dynamic brand and profile data projected for the Staff Shell. */
export type StaffNavigationProjection = {
  brand: {
    name: string;
    room: string;
  };
  profile: {
    initial: string;
    name: string;
    role: string;
  };
};

/** Reads the tenant-scoped data required by the Staff Shell projection. */
export interface StaffShellReader {
  /**
   * Reads the daycare branding, person profile and assigned rooms.
   *
   * @param daycareId - PostgreSQL daycare identifier.
   * @param personId - PostgreSQL person identifier.
   * @returns Persisted Staff Shell data, or `null` when the person is absent.
   */
  findByPerson(
    daycareId: string,
    personId: string,
  ): Promise<StaffShellRecord | null>;
}
