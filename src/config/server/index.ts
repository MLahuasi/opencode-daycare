import "server-only";

export { LOGIN_RATE_LIMITS } from "./login-rate-limit";

export {
  getApplicationEnvironment,
  getAuthEnvironment,
  getCloudinaryEnvironment,
  getHttpSecurityEnvironment,
  getLoginRateLimitEnvironment,
  getMailerEnvironment,
  getSupabaseEnvironment,
  validateEnvironment,
} from "./environment";

export type {
  ApplicationEnvironment,
  AuthEnvironment,
  CloudinaryEnvironment,
  Environment,
  HttpSecurityEnvironment,
  LoginRateLimitEnvironment,
  MailerEnvironment,
  SupabaseEnvironment,
} from "./environment";
