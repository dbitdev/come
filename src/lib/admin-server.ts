import "server-only";

import { adminAuth } from "./firebase-admin";

const ADMIN_EMAILS = new Set(["dbitdev@gmail.com", "admin@come.mx", "parradabito@gmail.com"]);

export async function requirePlatformAdmin(request: Request) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) throw new Error("UNAUTHORIZED");
  const decoded = await adminAuth.verifyIdToken(bearer);
  if (!decoded.email || !ADMIN_EMAILS.has(decoded.email) || decoded.email_verified === false) {
    throw new Error("FORBIDDEN");
  }
  return decoded;
}
