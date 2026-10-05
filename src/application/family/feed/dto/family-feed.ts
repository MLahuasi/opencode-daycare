import type {
  FamilyFeedFilter,
  ParentKid,
} from "@/domain/family";
import type { Kid } from "@/domain/kid";
import type { Person } from "@/domain/person";
import type { Post } from "@/domain/post";
import type { Room } from "@/domain/room";

/** Server-authorized relationships and records used by Family Feed. */
export type FamilyFeedContext = {
  person: Person;
  parentKids: readonly ParentKid[];
  kids: readonly Kid[];
  activeKids: readonly Kid[];
  rooms: readonly Room[];
};

/** Neutral data projection used by the Family Feed route. */
export type FamilyFeedProjection = {
  context: FamilyFeedContext;
  posts: readonly Post[];
  selectedFilter: FamilyFeedFilter;
};
