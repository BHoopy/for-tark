import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { getSql } from "@/lib/neon";
import type { AuthUser } from "@/types/auth";

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE = "psimply_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSessionSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.DATABASE_URL ||
    "psimply-local-development-secret"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string | null,
): Promise<boolean> {
  if (!storedHash) return false;

  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;

  return (
    expected.length === derived.length && timingSafeEqual(expected, derived)
  );
}

export function createSession(userId: string): void {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + SESSION_MAX_AGE * 1000 }),
  ).toString("base64url");

  cookies().set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSession(): void {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionUserId(): string | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(payload);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { uid?: string; exp?: number };

    if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) return null;
    return parsed.uid;
  } catch {
    return null;
  }
}

export function mapUserRow(row: Record<string, any>): AuthUser {
  return {
    id: String(row.id),
    uid: row.uid,
    email: row.email ?? null,
    displayName: row.display_name ?? null,
    photoURL: row.photo_url ?? null,
    coverImageURL: row.cover_image_url ?? null,
    isGuest: Boolean(row.is_guest),
  };
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const uid = getSessionUserId();
  if (!uid) return null;

  const sql = getSql();
  const rows = (await sql`
    SELECT id, uid, email, display_name, photo_url, cover_image_url, is_guest
    FROM psimply.users
    WHERE uid = ${uid}
    LIMIT 1
  `) as Record<string, any>[];

  if (!rows || rows.length === 0) return null;
  return mapUserRow(rows[0]);
}
