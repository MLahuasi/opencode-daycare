import "server-only";

import type { Mailer } from "@jmlq/mailer";
import { JmlqMailerProvider } from "./jmlq/jmlq-mailer-provider";

let mailerInstance: Mailer | undefined;
let initializationPromise: Promise<void> | undefined;

async function initializeMailer(): Promise<void> {
  if (!mailerInstance) {
    const provider = new JmlqMailerProvider();
    mailerInstance = provider.createClient();
  }
}

/** Server-only facade for the configured mailer lifecycle. */
export const mailerClient = {
  /** Builds the mail transport and renderer once for this server instance. */
  initialize(): Promise<void> {
    initializationPromise ??= initializeMailer();
    return initializationPromise;
  },
};
