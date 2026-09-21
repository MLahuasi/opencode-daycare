import "server-only";

import path from "node:path";
import env from "env-var";

type Environment = {
  mailer: {
    MAILER_EMAIL: string;
    MAILER_SECRET_KEY: string;
    MAILER_FROM: string;
    MAIL_HOST: string;
    MAIL_PORT: number;
    MAIL_SECURE: boolean;
    MAIL_TEMPLATE_PATH: string;
    MAIL_TEMPLATE_EXTENSION: string;
  };
};

let cachedEnvironment: Environment | undefined;

function readRequiredString(name: string): string {
  const value = env.get(name).required().asString().trim();

  if (!value) {
    throw new Error(`[environment] ${name} must not be empty`);
  }

  return value;
}

/**
 * Reads, validates, and caches the application's server-side environment.
 * Add new typed sections here as infrastructure requirements grow.
 *
 * @returns The validated server-side environment configuration.
 */
export function getEnvironment(): Environment {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  const secure = env
    .get("MAIL_SECURE")
    .required()
    .asEnum(["true", "false"]);

  const environment: Environment = {
    mailer: {
      MAILER_EMAIL: readRequiredString("MAILER_EMAIL"),
      MAILER_SECRET_KEY: readRequiredString("MAILER_SECRET_KEY"),
      MAILER_FROM: readRequiredString("MAILER_FROM"),
      MAIL_HOST: readRequiredString("MAIL_HOST"),
      MAIL_PORT: env.get("MAIL_PORT").required().asIntPositive(),
      MAIL_SECURE: secure === "true",
      MAIL_TEMPLATE_PATH: path.resolve(
        process.cwd(),
        readRequiredString("MAIL_TEMPLATE_PATH"),
      ),
      MAIL_TEMPLATE_EXTENSION: readRequiredString(
        "MAIL_TEMPLATE_EXTENSION",
      ),
    },
  };

  cachedEnvironment = environment;
  return environment;
}
