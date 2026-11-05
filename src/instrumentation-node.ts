import "server-only";

/** Loads and runs the server bootstrap in the Node.js instrumentation context. */
export async function registerNodeInstrumentation(): Promise<void> {
  const { bootstrapApplication } = await import("./bootstrap");
  await bootstrapApplication();
}
