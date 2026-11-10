import { NextResponse, type NextRequest } from "next/server";
import {
  CLIENT_IP_HEADER,
  resolveClientIp,
} from "@/infrastructure/http/client-ip";

const NONCE_HEADER = "x-nonce";

/**
 * Generates the request-scoped security context before Next.js renders HTML.
 *
 * The CSP is copied to both the request and response so Next.js can extract
 * the nonce during dynamic rendering and the browser can enforce it.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  const clientIp = resolveClientIp(request);

  // Never trust client-supplied values for either internal header.
  requestHeaders.delete(CLIENT_IP_HEADER);
  requestHeaders.delete(NONCE_HEADER);
  requestHeaders.delete("content-security-policy");

  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set("content-security-policy", contentSecurityPolicy);

  if (clientIp) {
    requestHeaders.set(CLIENT_IP_HEADER, clientIp);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("content-security-policy", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
