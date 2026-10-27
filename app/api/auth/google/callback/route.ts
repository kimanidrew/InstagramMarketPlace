import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { session } from "@/lib/auth";

type GoogleProfile = { sub: string; email: string; email_verified: boolean | string; name?: string };

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const fail = (reason: string) => NextResponse.redirect(new URL("/login?error=" + encodeURIComponent(reason), origin));
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("sokolink_google_state")?.value;
  cookieStore.delete("sokolink_google_state");
  if (requestUrl.searchParams.has("error")) return fail("google_cancelled");
  if (!code || !state || !savedState || state.length !== savedState.length || !timingSafeEqual(Buffer.from(state), Buffer.from(savedState))) return fail("google_state");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("google_config");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: new URL("/api/auth/google/callback", origin).toString(),
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return fail("google_token");
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) return fail("google_token");
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: "Bearer " + tokens.access_token }, cache: "no-store",
    });
    if (!profileResponse.ok) return fail("google_profile");
    const profile = await profileResponse.json() as GoogleProfile;
    if (!profile.email || !(profile.email_verified === true || profile.email_verified === "true")) return fail("google_email");

    const database = db();
    const email = profile.email.trim().toLowerCase();
    let account = await database.user.findUnique({ where: { email } });
    if (!account) {
      account = await database.user.create({
        data: {
          email,
          name: profile.name?.trim() || email.split("@")[0],
          // Google-authenticated accounts don't use this password; a random hash keeps the existing schema compatible.
          passwordHash: await bcrypt.hash(randomBytes(48).toString("hex"), 12),
        },
      });
    }
    await session(account.id);
    return NextResponse.redirect(new URL(account.role === "ADMIN" ? "/admin" : "/account", origin));
  } catch {
    return fail("google_error");
  }
}
