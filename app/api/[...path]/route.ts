import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.BACKEND_URL!; // https://expense-tracker-879x.onrender.com/api-v1

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  const url = `${API_URL}/${path.join("/")}${req.nextUrl.search}`;

  const response = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": req.headers.get("content-type") ?? "application/json",
      Cookie: req.headers.get("cookie") ?? "",
    },
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await req.text(),
  });

  const body = await response.text();

  const nextResponse = new NextResponse(body, {
    status: response.status,
  });

  // Forward ALL Set-Cookie headers
  const setCookies = response.headers.getSetCookie?.() ?? [];
  setCookies.forEach((cookie) => {
    nextResponse.headers.append("Set-Cookie", cookie);
  });

  return nextResponse;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;