import { NextResponse } from "next/server";

// Allowed image pattern
const SAFE_IMAGE_REGEX = /^[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp|gif)$/i;

// Injection detection
const BLOCKED = /(\.\.|;|\||`|\$|>|<|%7C|%3B|%60|%24|%3E|%3C)/i;

export function middleware(req) {
  console.log("middleware working?");
  let pathname = req.nextUrl.pathname;

  // always run middleware for every request
  try {
    pathname = decodeURIComponent(pathname);
  } catch {}

  // detect if request is "intended" as image
  const probableImage =
    pathname.includes(".png") ||
    pathname.includes(".jpg") ||
    pathname.includes(".jpeg") ||
    pathname.includes(".webp") ||
    pathname.includes(".gif");

  if (!probableImage) {
    return NextResponse.next();
  }

  // block encoded or non-encoded injection characters
  if (BLOCKED.test(pathname)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // block any characters after extension
  if (!pathname.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
    return new NextResponse("Invalid filename structure", { status: 400 });
  }

  // final filename allowlist
  if (!SAFE_IMAGE_REGEX.test(pathname)) {
    return new NextResponse("Invalid image filename", { status: 400 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/:path*", // force all paths through middleware
  ],
};
