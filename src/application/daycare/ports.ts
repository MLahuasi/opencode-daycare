/** Reads the daycare selected as the current operational tenant. */
export interface CurrentDaycareReader {
  getCurrentDaycareId(): Promise<string>;
}
