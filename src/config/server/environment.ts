import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

export type ApplicationEnvironment = {
  appUrl: string;
  nodeEnvironment: "development" | "test" | "production";
  isBuild: boolean;
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
  dbHost: string;
  dbPort: number;
  dbUsername: string;
  dbPassword: string;
  runRemoteDbTests: boolean;
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
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`[environment] Invalid or missing variable: ${name}`);
  }

  return value;
}

function readUrl(name: string, protocols: readonly string[]): string {
  const value = readRequiredString(name);
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`[environment] Invalid URL variable: ${name}`);
  }

  if (!protocols.includes(parsedUrl.protocol)) {
    throw new Error(`[environment] Invalid URL protocol for variable: ${name}`);
  }

  return name === "APP_URL" ? parsedUrl.toString().replace(/\/$/, "") : value;
}

function readPositiveInteger(name: string): number {
  const value = readRequiredString(name);
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`[environment] Invalid positive integer variable: ${name}`);
  }

  return parsedValue;
}

function readBoolean(name: string): boolean {
  const value = readRequiredString(name);

  if (value !== "true" && value !== "false") {
    throw new Error(`[environment] Invalid boolean variable: ${name}`);
  }

  return value === "true";
}

function readOptionalBoolean(name: string): boolean {
  return process.env[name]?.trim() === "true";
}

function readEnum<T extends string>(name: string, values: readonly T[]): T {
  const value = readRequiredString(name);

  if (!values.includes(value as T)) {
    throw new Error(`[environment] Invalid enum variable: ${name}`);
  }

  return value as T;
}

function readEnvironment(): Environment {
  const mailTemplatePath = path.join(process.cwd(), "templates");

  if (!existsSync(mailTemplatePath)) {
    throw new Error("[environment] Invalid runtime path variable: MAIL_TEMPLATE_PATH");
  }

  return {
    application: {
      appUrl: readUrl("APP_URL", ["http:", "https:"]),
      nodeEnvironment: readEnum(
        "NODE_ENV",
        ["development", "test", "production"],
      ),
      isBuild: process.env.NEXT_PHASE === "phase-production-build",
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
      AUTH_SESSION_COOKIE_SAME_SITE: readEnum(
        "AUTH_SESSION_COOKIE_SAME_SITE",
        ["lax", "strict", "none"],
      ),
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
      url: readUrl("CLOUDINARY_URL", ["cloudinary:"]),
    },
    supabase: {
      dbHost: readRequiredString("SUPABASE_DB_HOST"),
      dbPort: readPositiveInteger("SUPABASE_DB_PORT"),
      dbUsername: readRequiredString("SUPABASE_DB_USERNAME"),
      dbPassword: readRequiredString("SUPABASE_DB_PASSWORD"),
      runRemoteDbTests: readOptionalBoolean("RUN_REMOTE_DB_TESTS"),
    },
  };
}

/** Validates and caches the complete server-side environment. */
export function validateEnvironment(): void {
  if (!cachedEnvironment) {
    cachedEnvironment = readEnvironment();
  }
}

function getCachedEnvironment(): Environment {
  validateEnvironment();
  return cachedEnvironment as Environment;
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
