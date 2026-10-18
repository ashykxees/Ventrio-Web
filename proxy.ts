import { NextResponse, type NextRequest } from "next/server";

// 1. Fast redirect for signed-out visitors on member/admin pages. Real authorization still happens
//    on the server in lib/session.ts (requireMember / requireAdmin) for every page and action.
// 2. Passes the pathname to the root layout (x-pathname) for the pre-launch teaser gate.
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];
const PROTECTED = [/^\/profile$/, /^\/settings$/, /^\/admin(\/.*)?$/];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (!hasSession && PROTECTED.some((pattern) => pattern.test(pathname))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|brand|icon.svg|favicon.ico).*)"],
};
