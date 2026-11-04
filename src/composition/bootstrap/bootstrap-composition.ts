import "server-only";

import { databaseClient } from "@/infrastructure/adapters/database";
import { imageStorageClient } from "@/infrastructure/adapters/image-storage";
import { mailerClient } from "@/infrastructure/adapters/mailer";

/** Server-side composition of the external clients required during bootstrap. */
export function createBootstrapComposition() {
  return {
    databaseClient,
    mailerClient,
    imageStorageClient,
  };
}
