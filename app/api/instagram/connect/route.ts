import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { instagramOAuthUrl } from "@/lib/instagram";

const secret = () => process.env.AUTH_SECRET || "change-me";

export async function GET(r: Request) {
  const u = await user();
  if (!u) return NextResponse.redirect(new URL("/login", r.url));

  const requestId = new URL(r.url).searchParams.get("requestId");
  if (!requestId) return NextResponse.redirect(new URL("/account?instagram_error=Select%20an%20approved%20shop%20first.", r.url));

  const request = await db().storeRequest.findFirst({
    where: { id: requestId, userId: u.id, status: "APPROVED" },
  });
  if (!request) return NextResponse.redirect(new URL("/account?instagram_error=That%20shop%20is%20not%20approved%20for%20connection.", r.url));

  const payload = Buffer.from(JSON.stringify({
    uid: u.id,
    requestId: request.id,
    username: request.username,
    exp: Date.now() + 600000,
    nonce: randomBytes(16).toString("hex"),
  })).toString("base64url");

  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  const state = payload + "." + sig;
  const res = NextResponse.redirect(instagramOAuthUrl(state));
  res.cookies.set("instagram_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}