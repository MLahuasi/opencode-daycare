import type { DatabaseConnectionChecker } from "./ports";

/**
 * Checks the configured database gateway through the application port.
 *
 * @param checker - Database connection checker provided by Composition.
 * @returns A promise that resolves when the gateway is available.
 */
export async function checkDatabaseConnection(
  checker: DatabaseConnectionChecker,
): Promise<void> {
  await checker.check();
}
