import type { ParentKid } from "../types";

/**
 * Determines whether a kid has effective photo sharing authorization.
 *
 * @param kidId Identifier of the kid whose consent is evaluated.
 * @param parentKids Parent-to-kid relationships to inspect.
 * @returns True only when the kid has at least one relationship and every parent consents.
 */
export function hasKidPhotoSharingConsent(
  kidId: string,
  parentKids: readonly ParentKid[],
): boolean {
  const kidRelationships = parentKids.filter((parentKid) => parentKid.kidId === kidId);

  return kidRelationships.length > 0 && kidRelationships.every((parentKid) => parentKid.photoSharingConsent);
}
