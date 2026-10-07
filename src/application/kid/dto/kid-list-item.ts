/** Safe, derived data used by the client-side kid list and filter. */
export type KidListItem = {
  slug: string;
  name: string;
  room: string;
  initial: string;
  age: number;
  parentCount: number;
  shouldLinkParent: boolean;
  allergies: string[];
};
