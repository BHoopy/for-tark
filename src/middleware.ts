import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["en"],

  defaultLocale: "en",
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // French is no longer supported: send any /fr path to its English equivalent.
  if (pathname === "/fr" || pathname.startsWith("/fr/")) {
    const url = request.nextUrl.clone();
    const rest = pathname.replace(/^\/fr/, "");
    url.pathname = rest.length > 0 ? `/en${rest}` : "/en";
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. /favicon.ico)
  matcher: ["/", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
