import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import { connect, exchangeInstagramCode, ig, sync } from "@/lib/instagram";

const secret = () => process.env.AUTH_SECRET || "change-me";

function verify(v: string) {
  try {
    const [a, b] = v.split(".");
    const e = createHmac("sha256", secret()).update(a).digest("base64url");
    if (!a || !b || e.length !== b.length || !timingSafeEqual(Buffer.from(e), Buffer.from(b))) return null;
    const p = JSON.parse(Buffer.from(a, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

export async function GET(r: Request) {
  const url = new URL(r.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error_reason") || url.searchParams.get("error_description");
  const fail = (m: string) => NextResponse.redirect(new URL("/account?instagram_error=" + encodeURIComponent(m), r.url));

  if (error) return fail(error);

  const saved = (await cookies()).get("instagram_oauth_state")?.value;
  if (!code || !state || !saved || state !== saved) return fail("Instagram authorization expired. Please try again.");

  const s = verify(state);
  if (!s?.uid || !s?.requestId || !s?.username) return fail("Invalid Instagram authorization state.");

  try {
    const approved = await db().storeRequest.findFirst({
      where: { id: s.requestId, userId: s.uid, status: "APPROVED" },
    });
    if (!approved) return fail("This shop is no longer approved for Instagram connection.");

    const exchanged = await exchangeInstagramCode(code);
    const token = exchanged.accessToken;
    const profile = await ig<{ user_id?: string; id?: string; username?: string }>(
      token,
      "me",
      { fields: "user_id,username" }
    );
    const username = String(profile.username || "").toLowerCase();

    if (!username) return fail("Instagram did not return a username.");
    if (username !== approved.username.toLowerCase()) {
      return fail(
        "You authorized @" + username + ", but this shop is approved for @" +
        approved.username + ". Please authorize the approved Instagram account."
      );
    }

    const connection = await connect(token, s.uid);
    await sync(connection.id);

    const res = NextResponse.redirect(new URL("/account/setup?setup=" + encodeURIComponent(s.requestId) + "&step=4&instagram=connected", r.url));
    res.cookies.delete("instagram_oauth_state");
    return res;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Instagram connection failed.");
  }
}