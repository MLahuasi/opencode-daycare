import type { CurrentDaycareReader } from "./ports";

/** Returns the current operational daycare identifier. */
export function getCurrentDaycareId(
  reader: CurrentDaycareReader,
): Promise<string> {
  return reader.getCurrentDaycareId();
}
