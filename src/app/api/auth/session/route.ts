import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const user = await getSessionUser();
    return NextResponse.json(
      { user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Session lookup error:", error);
    return NextResponse.json(
      { user: null },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
