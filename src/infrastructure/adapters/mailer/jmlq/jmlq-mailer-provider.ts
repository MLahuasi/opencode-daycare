import "server-only";

import {
  createMailer,
  FileEmailTemplate,
  NodemailerService,
  type Mailer,
} from "@jmlq/mailer";
import { getMailerEnvironment } from "@/config/server";

/** Creates the configured JMLQ mailer without connecting to SMTP. */
export class JmlqMailerProvider {
  /** Builds the mail transport and file-template renderer. */
  createClient(): Mailer {
    const mailer = getMailerEnvironment();
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

    return createMailer({
      mailer: mailerClient,
      templateRenderer,
    });
  }
}
