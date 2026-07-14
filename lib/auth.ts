import { createHash, randomBytes } from "crypto";

export const authCookieName = "pos_session";
export const defaultPasswordHash = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}
