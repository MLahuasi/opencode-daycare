import type {
  FamilyFeedFilter,
  FamilyFeedOption,
  ParentKid,
} from "@/src/domain/family";
import type { Kid } from "@/src/domain/kid";
import type { Person } from "@/src/domain/person";
import type { Post } from "@/src/domain/post";
import type { Room } from "@/src/domain/room";

/** Server-authorized relationships and records used by Family Feed. */
export type FamilyFeedContext = {
  person: Person;
  parentKids: readonly ParentKid[];
  kids: readonly Kid[];
  activeKids: readonly Kid[];
  rooms: readonly Room[];
};

/** Data projection rendered by the Family Feed route. */
export type FamilyFeedProjection = {
  context: FamilyFeedContext;
  options: readonly FamilyFeedOption[];
  posts: readonly Post[];
  selectedFilter: FamilyFeedFilter;
};
