import "server-only";

import path from "node:path";
import env from "env-var";

type Environment = {
  APP_URL: string;
  auth: {
    AUTH_SECRET: string;
    AUTH_SESSION_MAX_AGE_SECONDS: number;
    AUTH_SESSION_COOKIE_NAME: string;
    AUTH_SESSION_COOKIE_HTTP_ONLY: boolean;
    AUTH_SESSION_COOKIE_SECURE: boolean;
    AUTH_SESSION_COOKIE_SAME_SITE: "lax" | "strict" | "none";
    AUTH_SESSION_COOKIE_PATH: string;
    AUTH_SIGN_IN_PATH: string;
  };
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

function readAppUrl(): string {
  const value = readRequiredString("APP_URL");
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error("[environment] APP_URL must be a valid URL");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("[environment] APP_URL must use HTTP or HTTPS");
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

function readPositivePort(): number {
  const port = env.get("MAIL_PORT").required().asIntPositive();

  if (port === 0) {
    throw new Error("[environment] MAIL_PORT must be a positive integer");
  }

  return port;
}

function readPositiveInteger(name: string): number {
  return env.get(name).required().asIntPositive();
}

function readBoolean(name: string): boolean {
  return env.get(name).required().asEnum(["true", "false"]) === "true";
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
    APP_URL: readAppUrl(),
    auth: {
      AUTH_SECRET: readRequiredString("AUTH_SECRET"),
      AUTH_SESSION_MAX_AGE_SECONDS: readPositiveInteger(
        "AUTH_SESSION_MAX_AGE_SECONDS",
      ),
      AUTH_SESSION_COOKIE_NAME: readRequiredString(
        "AUTH_SESSION_COOKIE_NAME",
      ),
      AUTH_SESSION_COOKIE_HTTP_ONLY: readBoolean(
        "AUTH_SESSION_COOKIE_HTTP_ONLY",
      ),
      AUTH_SESSION_COOKIE_SECURE: readBoolean("AUTH_SESSION_COOKIE_SECURE"),
      AUTH_SESSION_COOKIE_SAME_SITE: env
        .get("AUTH_SESSION_COOKIE_SAME_SITE")
        .required()
        .asEnum(["lax", "strict", "none"]),
      AUTH_SESSION_COOKIE_PATH: readRequiredString("AUTH_SESSION_COOKIE_PATH"),
      AUTH_SIGN_IN_PATH: readRequiredString("AUTH_SIGN_IN_PATH"),
    },
    mailer: {
      MAILER_EMAIL: readRequiredString("MAILER_EMAIL"),
      MAILER_SECRET_KEY: readRequiredString("MAILER_SECRET_KEY"),
      MAILER_FROM: readRequiredString("MAILER_FROM"),
      MAIL_HOST: readRequiredString("MAIL_HOST"),
      MAIL_PORT: readPositivePort(),
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
