import { NextRequest, NextResponse } from "next/server";

const authCookieName = "pos_session";
const publicPaths = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthenticated = Boolean(request.cookies.get(authCookieName)?.value);

  if (isPublicPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isPublicPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
