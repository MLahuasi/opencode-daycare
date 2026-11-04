export type NextRuntime = "nodejs" | "edge";

/** Returns the runtime selected by Next.js for the current execution context. */
export function getRuntime(): NextRuntime {
  return process.env.NEXT_RUNTIME === "edge" ? "edge" : "nodejs";
}
