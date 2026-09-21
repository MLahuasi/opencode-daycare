/** Resolution state of an invitation code on the activation flow. */
export type ActivationInvitationState = "none" | "valid" | "unknown" | "expired" | "accepted";

/** Child summary projected for the activation card. */
export type ActivationKidCardData = {
  initial: string;
  name: string;
  room: string;
};