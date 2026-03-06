import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookie";
import { buildPublicUrl } from "@/lib/public-url";

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) {
    return NextResponse.next();
  }

  return NextResponse.redirect(buildPublicUrl(request, "/login"));
}

export const config = {
  matcher: ["/app/:path*"],
};
