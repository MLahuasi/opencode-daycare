export {
  ACTIVATION_PASSWORD_PATTERN,
  isValidActivationPassword,
} from "./credential";
export {
  isPasswordWithinUtf8Limit,
  MAX_PASSWORD_UTF8_BYTES,
  normalizePassword,
} from "./password-policy";
export type { Credential } from "./credential";
