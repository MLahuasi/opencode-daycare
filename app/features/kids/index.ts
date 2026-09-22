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
export { default as kidProfileStyles } from "./components/kid-profile.module.css";
export { default as kidsListStyles } from "./components/kids-list.module.css";

export type { Kid, KidListItem, KidStatus } from "./types";

export type { KidFormValues } from "./schemas";

export {
  calculateAge,
  hasKidPhotoSharingConsent,
  normalizeName,
  normalizeSlug,
  validateUniqueSlugs,
} from "./utils";
