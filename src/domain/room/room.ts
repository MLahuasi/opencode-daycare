import type { DaycareScoped } from "@/domain/daycare";

/** A daycare room available for kid assignment. */
export type Room = DaycareScoped & {
  id: string;
  name: string;
};
