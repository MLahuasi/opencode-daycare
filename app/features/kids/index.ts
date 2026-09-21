export {
  KidCard,
  KidsEmptyState,
  KidsFilter,
  KidsHeader,
  KidsRoomGroup,
  KidBasicInfo,
  KidForm,
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
} from "./types";

export {
  calculateAge,
  hasKidPhotoSharingConsent,
  normalizeName,
  normalizeSlug,
  validateUniqueSlugs,
} from "./utils";
