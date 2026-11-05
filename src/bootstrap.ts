import "server-only";

import { validateEnvironment } from "@/config/server";
import { createBootstrapComposition } from "@/composition/bootstrap";
import { createDatabaseComposition } from "@/composition/database";

let initializationPromise: Promise<void> | undefined;

async function initializeApplication(): Promise<void> {
  console.log("[bootstrap] Application initialization started");

  try {
    validateEnvironment();
    console.log("[environment] Server environment validated");

    const clients = createBootstrapComposition();
    await clients.databaseClient.initialize();
    console.log("[database] Client initialized");

    await clients.mailerClient.initialize();
    console.log("[mailer] Client initialized");

    await clients.imageStorageClient.initialize();
    console.log("[image-storage] Client initialized");

    await createDatabaseComposition().checkConnection();
    console.log("[database] PostgreSQL connection successful");
    console.log("[bootstrap] Application initialization completed");
  } catch {
    console.error("[bootstrap] Application initialization failed");
    throw new Error("[bootstrap] Application initialization failed");
  }
}

/** Initializes the server-side application once per Node.js instance. */
export function bootstrapApplication(): Promise<void> {
  initializationPromise ??= initializeApplication();
  return initializationPromise;
}
