import "server-only";

/** Server-only policy limits for credential login abuse protection. */
export const LOGIN_RATE_LIMITS = {
  accountFailureLimit: 5,
  ipFailureLimit: 20,
  windowSeconds: 15 * 60,
  blockSeconds: 15 * 60,
} as const;
