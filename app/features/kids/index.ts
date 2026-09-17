export {
  KidCard,
  KidsEmptyState,
  KidsFilter,
  KidsHeader,
  KidsRoomGroup,
  KidBasicInfo,
  KidMedicalNotes,
  KidParents,
  KidProfileActions,
  KidProfileHeader,
} from "./components";

export type {
  Kid,
  KidListItem,
  KidStatus,
  LinkedParent,
  ParentKid,
  ParentRelationship,
  Person,
  PersonRole,
  PersonStatus,
} from "./types";

export {
  calculateAge,
  hasKidPhotoSharingConsent,
  normalizeName,
  normalizeSlug,
  validateUniqueSlugs,
} from "./utils";
