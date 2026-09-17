import type { Invitation } from "@/app/features/auth";

/** Canonical invitation fixtures used by the account activation screen. */
export const invitations: readonly Invitation[] = [
  {
    id: "invitation-lucia-7k4p9",
    personId: "parent-lucia-fernandez",
    code: "7K4P9",
    expiresAt: new Date("2026-12-31T23:59:59.000Z"),
    acceptedAt: null,
  },
  {
    id: "invitation-carolina-expired",
    personId: "parent-carolina-mendez",
    code: "EXPIRED1",
    expiresAt: new Date("2026-01-31T23:59:59.000Z"),
    acceptedAt: null,
  },
  {
    id: "invitation-mariana-accepted",
    personId: "parent-mariana-ruiz",
    code: "ACCEPTED1",
    expiresAt: new Date("2026-12-31T23:59:59.000Z"),
    acceptedAt: new Date("2026-08-15T14:30:00.000Z"),
  },
];
