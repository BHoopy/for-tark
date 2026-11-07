import { NextRequest, NextResponse } from "next/server";
import { getTournamentPage } from "@/lib/tournaments-cache";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_LIMIT = 9;
const MAX_PAGE_LIMIT = 50;

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);

  const requestedPage = Number(searchParams.get("page"));
  const requestedLimit = Number(searchParams.get("pageLimit"));
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageLimit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_PAGE_LIMIT)
      : DEFAULT_PAGE_LIMIT;

  try {
    const data = await getTournamentPage(page, pageLimit);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching paginated tournaments:", error);
    return NextResponse.json(
      { error: "Failed to load tournaments" },
      { status: 500 },
    );
  }
}
