import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSql } from "@/lib/neon";
import { createSession, hashPassword, mapUserRow } from "@/lib/auth";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (username.length < 2) {
    return NextResponse.json(
      { error: "Username must be at least 2 characters long." },
      { status: 400 },
    );
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters long." },
      { status: 400 },
    );
  }

  try {
    const sql = getSql();

    const existing = (await sql`
      SELECT id FROM psimply.users WHERE lower(email) = ${email} LIMIT 1
    `) as { id: string }[];

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(password);

    const rows = (await sql`
      INSERT INTO psimply.users (id, uid, email, display_name, password_hash, is_guest)
      VALUES (${uid}, ${uid}, ${email}, ${username}, ${passwordHash}, false)
      RETURNING id, uid, email, display_name, photo_url, cover_image_url, is_guest
    `) as Record<string, any>[];

    createSession(uid);

    return NextResponse.json({ user: mapUserRow(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Could not create your account. Please try again." },
      { status: 500 },
    );
  }
}
