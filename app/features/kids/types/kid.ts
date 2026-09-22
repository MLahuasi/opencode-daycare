/** Lifecycle status assigned to a kid. */
export type KidStatus = "active" | "inactive";

/** Canonical persisted information for a kid. */
export type Kid = {
  id: string;
  slug: string;
  name: string;
  birthDate: string;
  roomId: string;
  enrollmentDate: string;
  medicalNotes: string;
  allergies: string;
  status: KidStatus;
};