import { ipAddress } from "@vercel/functions";

/** Header used to carry the trusted request IP past the HTTP boundary. */
export const CLIENT_IP_HEADER = "x-open-daycare-client-ip";

/**
 * Resolves the request IP from Vercel's trusted request metadata.
 *
 * Callers must not fall back to a client-controlled forwarding header. The
 * proxy is responsible for removing any incoming internal header and for
 * forwarding only the value returned by this resolver.
 *
 * @param request - The incoming request at the HTTP boundary.
 * @returns The Vercel-resolved IP, or `undefined` when Vercel cannot provide it.
 */
export function resolveClientIp(request: Request): string | undefined {
  return ipAddress(request);
}
