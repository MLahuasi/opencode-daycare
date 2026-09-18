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
  KidFormValues,
  KidListItem,
  KidStatus,
  LinkedParent,
  ParentKid,
  ParentRelationship,
  Person,
  PersonRole,
  PersonStatus,
  Room,
} from "./types";

export {
  calculateAge,
  hasKidPhotoSharingConsent,
  normalizeName,
  normalizeSlug,
  validateUniqueSlugs,
} from "./utils";
