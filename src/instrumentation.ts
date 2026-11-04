import { getRuntime } from "@/config/runtime";

/** Runs the application bootstrap only for the Node.js Next.js runtime. */
export async function register(): Promise<void> {
  if (getRuntime() !== "nodejs") {
    return;
  }

  const { bootstrapApplication } = await import("./bootstrap");
  await bootstrapApplication();
}
