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

export {
  validateKidAllergies,
  validateKidBirthDate,
  validateKidForm,
  validateKidMedicalNotes,
  validateKidName,
  validateKidRoomId,
} from "./schemas";

export type {
  KidFieldValidationResult,
  KidFormErrors,
  KidFormInput,
  KidFormValidationResult,
} from "./schemas";
