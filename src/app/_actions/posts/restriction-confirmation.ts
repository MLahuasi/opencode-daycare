import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnvironment } from "@/infrastructure/config/server";

const TOKEN_MAX_AGE_MS = 10 * 60 * 1000;

type RestrictionConfirmationPayload = {
  exp: number;
  kidIds: string[];
  postId: string | null;
  restrictedKidIds: string[];
  personId: string;
};

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", getEnvironment().auth.AUTH_SECRET)
    .update(value)
    .digest("base64url");
}

/**
 * Creates a short-lived confirmation bound to the original post targets.
 */
export function createRestrictionConfirmationToken(input: {
  kidIds: readonly string[];
  personId: string;
  postId: string | null;
  restrictedKidIds: readonly string[];
}): string {
  const payload: RestrictionConfirmationPayload = {
    exp: Date.now() + TOKEN_MAX_AGE_MS,
    kidIds: [...input.kidIds],
    postId: input.postId,
    restrictedKidIds: [...input.restrictedKidIds],
    personId: input.personId,
  };
  const encodedPayload = encode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

/**
 * Verifies a confirmation token and returns its bound payload when valid.
 */
export function verifyRestrictionConfirmationToken(
  token: string,
  personId: string,
  postId: string | null,
): RestrictionConfirmationPayload | null {
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const expectedSignature = sign(encodedPayload);
  const receivedSignature = Buffer.from(encodedSignature, "base64url");
  const expectedSignatureBytes = Buffer.from(expectedSignature, "base64url");

  if (
    receivedSignature.length !== expectedSignatureBytes.length ||
    !timingSafeEqual(receivedSignature, expectedSignatureBytes)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(encodedPayload)) as RestrictionConfirmationPayload;

    if (
      payload.personId !== personId ||
      payload.postId !== postId ||
      payload.exp <= Date.now() ||
      !Array.isArray(payload.kidIds) ||
      !Array.isArray(payload.restrictedKidIds)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
