import { NextResponse, type NextRequest } from "next/server";

// Routes that do NOT require authentication
const PUBLIC_PATHS = ["/login", "/register", "/reset-password"];

// Routes that require authentication but skip the membership bootstrap check
const AUTH_PATHS_REGEX = /^\/(dashboard|ventes|achats|stock|contacts|rapports|parametres)/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read JWT access token from cookies (set after login)
  const accessToken = request.cookies.get("sp_access")?.value;

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAppPath = AUTH_PATHS_REGEX.test(pathname);

  // Redirect unauthenticated users trying to access app routes
  if (isAppPath && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isPublicPath && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
