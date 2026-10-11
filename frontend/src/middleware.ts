import { NextResponse, type NextRequest } from "next/server";

// Pages réservées aux visiteurs non connectés (redirigés vers le dashboard sinon).
// /reset-password et /invitation restent accessibles même connecté : on peut y
// arriver depuis un email alors qu'une autre session est ouverte.
const PUBLIC_PATHS = ["/login", "/register"];

// Routes that require authentication but skip the membership bootstrap check
const AUTH_PATHS_REGEX = /^\/(dashboard|produits|ventes|achats|stock|contacts|rapports|parametres)/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Marqueur de session posé au login (durée du refresh token), cf. authStore.
  const hasSession = request.cookies.get("sp_session")?.value === "1";

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAppPath = AUTH_PATHS_REGEX.test(pathname);

  // Redirect unauthenticated users trying to access app routes
  if (isAppPath && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isPublicPath && hasSession) {
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
