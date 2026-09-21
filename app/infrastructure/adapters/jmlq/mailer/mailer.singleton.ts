import "server-only";

import {
  createMailer,
  FileEmailTemplate,
  NodemailerService,
  type Mailer,
} from "@jmlq/mailer";
import { getEnvironment } from "@/app/shared/config/server";

let mailerInstance: Mailer | undefined;

/**
 * Returns the lazily initialized application mailer.
 *
 * @returns The shared mailer instance configured for SMTP and file templates.
 */
export function getMailer(): Mailer {
  if (mailerInstance) {
    return mailerInstance;
  }

  const { mailer } = getEnvironment();
  const mailerClient = new NodemailerService({
    host: mailer.MAIL_HOST,
    port: mailer.MAIL_PORT,
    secure: mailer.MAIL_SECURE,
    auth: {
      user: mailer.MAILER_EMAIL,
      pass: mailer.MAILER_SECRET_KEY,
    },
    from: mailer.MAILER_FROM,
  });
  const templateRenderer = new FileEmailTemplate({
    templatesPath: mailer.MAIL_TEMPLATE_PATH,
    extension: mailer.MAIL_TEMPLATE_EXTENSION,
  });

  mailerInstance = createMailer({
    mailer: mailerClient,
    templateRenderer,
  });

  return mailerInstance;
}
