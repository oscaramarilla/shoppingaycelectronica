import { NextRequest, NextResponse } from "next/server";

const adminUser = process.env.ADMIN_USER;
const adminPass = process.env.ADMIN_PASS;

function unauthorizedResponse() {
  return new NextResponse("Acceso administrativo restringido.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="AYC Electronica Admin"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function hasValidCredentials(authorization: string | null) {
  if (!authorization?.startsWith("Basic ") || !adminUser || !adminPass) return false;

  try {
    const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;
    return decoded.slice(0, separator) === adminUser && decoded.slice(separator + 1) === adminPass;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && (!adminUser || !adminPass)) {
    return NextResponse.json(
      { error: "admin_protection_not_configured" },
      { status: 500 },
    );
  }

  if (!hasValidCredentials(request.headers.get("authorization"))) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/gestion/:path*", "/admin/:path*", "/api/admin/:path*"],
};
