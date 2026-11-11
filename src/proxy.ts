import { NextResponse, type NextRequest } from "next/server";
import {
  CLIENT_IP_HEADER,
  resolveClientIp,
} from "@/infrastructure/http/client-ip";
import { getApplicationEnvironment } from "@/config/server";

const NONCE_HEADER = "x-nonce";

/**
 * Generates the request-scoped security context before Next.js renders HTML.
 *
 * The CSP is copied to both the request and response so Next.js can extract
 * the nonce during dynamic rendering and the browser can enforce it.
 */
export function proxy(request: NextRequest) {
  // The nonce is unique to this request and is shared with Next.js through
  // the CSP header so framework-generated scripts can be rendered safely.
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

  // These headers are internal transport metadata. Remove any client-supplied
  // values before adding the values calculated by this proxy.
  requestHeaders.delete(CLIENT_IP_HEADER);
  requestHeaders.delete("x-forwarded-for");
  requestHeaders.delete("x-real-ip");
  requestHeaders.delete(NONCE_HEADER);
  requestHeaders.delete("content-security-policy");

  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set("content-security-policy", contentSecurityPolicy);

  if (clientIp) {
    requestHeaders.set(CLIENT_IP_HEADER, clientIp);
  }

  // `request.headers` is forwarded upstream to Next.js; it is not exposed to
  // the browser. Response headers below are the ones sent to the browser.
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Restricts executable and embeddable resources to the approved policy and
  // the nonce generated for this request.
  response.headers.set("content-security-policy", contentSecurityPolicy);

  // Prevents browsers from guessing a different MIME type for a response.
  response.headers.set("x-content-type-options", "nosniff");

  // Limits the URL information sent as the Referer header to other origins.
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");

  // Disables browser capabilities that this application does not need.
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  const applicationEnvironment = getApplicationEnvironment();
  // HSTS is only safe to advertise from production HTTPS responses. Sending
  // it during local HTTP development can make the browser force HTTPS later.
  if (
    applicationEnvironment.nodeEnvironment === "production" &&
    request.nextUrl.protocol === "https:"
  ) {
    // Tells the browser to use HTTPS for this host and its subdomains for one
    // year after receiving this production HTTPS response.
    response.headers.set(
      "strict-transport-security",
      "max-age=31536000; includeSubDomains",
    );
  }

  return response;
}

export const config = {
  matcher: [
    {
      // Protect application and API routes while avoiding static assets that
      // do not participate in dynamic HTML rendering.
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
