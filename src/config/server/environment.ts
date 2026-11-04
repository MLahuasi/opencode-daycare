import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";
import env from "env-var";

export type ApplicationEnvironment = {
  appUrl: string;
  nodeEnvironment: "development" | "test" | "production";
};

export type AuthEnvironment = {
  AUTH_SECRET: string;
  AUTH_SESSION_MAX_AGE_SECONDS: number;
  AUTH_SESSION_COOKIE_NAME: string;
  AUTH_SESSION_COOKIE_HTTP_ONLY: boolean;
  AUTH_SESSION_COOKIE_SECURE: boolean;
  AUTH_SESSION_COOKIE_SAME_SITE: "lax" | "strict" | "none";
  AUTH_SESSION_COOKIE_PATH: string;
  AUTH_SIGN_IN_PATH: string;
};

export type MailerEnvironment = {
  MAILER_EMAIL: string;
  MAILER_SECRET_KEY: string;
  MAILER_FROM: string;
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_SECURE: boolean;
  MAIL_TEMPLATE_PATH: string;
  MAIL_TEMPLATE_EXTENSION: string;
};

export type CloudinaryEnvironment = {
  url: string;
};

export type SupabaseEnvironment = {
  url: string;
  publishableKey: string;
  dbPassword: string;
};

export type Environment = {
  application: ApplicationEnvironment;
  auth: AuthEnvironment;
  mailer: MailerEnvironment;
  cloudinary: CloudinaryEnvironment;
  supabase: SupabaseEnvironment;
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

function readPositiveInteger(name: string): number {
  return env.get(name).required().asIntPositive();
}

function readBoolean(name: string): boolean {
  return env.get(name).required().asEnum(["true", "false"]) === "true";
}

function readEnvironment(): Environment {
  const mailTemplatePath = path.join(process.cwd(), "templates");

  if (!existsSync(mailTemplatePath)) {
    throw new Error(
      `[environment] Mail template directory does not exist: ${mailTemplatePath}`,
    );
  }

  return {
    application: {
      appUrl: readAppUrl(),
      nodeEnvironment: env
        .get("NODE_ENV")
        .default("development")
        .asEnum(["development", "test", "production"]),
    },
    auth: {
      AUTH_SECRET: readRequiredString("AUTH_SECRET"),
      AUTH_SESSION_MAX_AGE_SECONDS: readPositiveInteger(
        "AUTH_SESSION_MAX_AGE_SECONDS",
      ),
      AUTH_SESSION_COOKIE_NAME: readRequiredString("AUTH_SESSION_COOKIE_NAME"),
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
      MAIL_PORT: readPositiveInteger("MAIL_PORT"),
      MAIL_SECURE: readBoolean("MAIL_SECURE"),
      MAIL_TEMPLATE_PATH: mailTemplatePath,
      MAIL_TEMPLATE_EXTENSION: readRequiredString("MAIL_TEMPLATE_EXTENSION"),
    },
    cloudinary: {
      url: readRequiredString("CLOUDINARY_URL"),
    },
    supabase: {
      url: readRequiredString("NEXT_PUBLIC_SUPABASE_URL"),
      publishableKey: readRequiredString("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
      dbPassword: readRequiredString("SUPABASE_DB_PASSWORD"),
    },
  };
}

function getCachedEnvironment(): Environment {
  cachedEnvironment ??= readEnvironment();
  return cachedEnvironment;
}

/** Returns the validated application configuration. */
export function getApplicationEnvironment(): ApplicationEnvironment {
  return getCachedEnvironment().application;
}

/** Returns the validated authentication configuration. */
export function getAuthEnvironment(): AuthEnvironment {
  return getCachedEnvironment().auth;
}

/** Returns the validated mailer configuration. */
export function getMailerEnvironment(): MailerEnvironment {
  return getCachedEnvironment().mailer;
}

/** Returns the validated Cloudinary configuration. */
export function getCloudinaryEnvironment(): CloudinaryEnvironment {
  return getCachedEnvironment().cloudinary;
}

/** Returns the validated Supabase configuration. */
export function getSupabaseEnvironment(): SupabaseEnvironment {
  return getCachedEnvironment().supabase;
}
