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
  Parent,
  ParentRelationship,
  ParentStatus,
} from "./types";

export {
  calculateAge,
  normalizeName,
  normalizeSlug,
  validateUniqueSlugs,
} from "./utils";
