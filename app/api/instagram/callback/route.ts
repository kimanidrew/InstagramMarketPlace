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

  if (error) {
    const details = error.toLowerCase();
    if (/permission|role|tester|not authorized|access denied/.test(details)) {
      return fail("This Instagram account is not yet allowed to connect. Ask the SokoLink team to add your exact Instagram username as an Instagram tester in Meta, accept the invitation, then try again.");
    }
    return fail("Instagram could not authorize this connection. Please check your account type and try again.");
  }

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
    let profile: { user_id?: string; id?: string; username?: string; account_type?: string };
    try {
      profile = await ig<{ user_id?: string; id?: string; username?: string; account_type?: string }>(
        token,
        "me",
        { fields: "user_id,username,account_type" }
      );
    } catch (profileError) {
      const message = profileError instanceof Error ? profileError.message.toLowerCase() : "";
      if (/permission|role|tester|not authorized|access denied/.test(message)) {
        return fail("Your Instagram account is not permitted to use the SokoLink Meta app yet. Ask an administrator to add you as an Instagram tester, accept the invitation, and reconnect.");
      }
      return fail("We could not read this Instagram profile. Make sure it is a Business or Creator account, then switch account type in Instagram Settings → Account type and tools and try again.");
    }
    const accountType = String(profile.account_type || "").toUpperCase();
    if (accountType && !["BUSINESS", "CREATOR", "MEDIA_CREATOR"].includes(accountType)) {
      return fail("This is a Personal Instagram account. Switch it to a Business or Creator account in Instagram Settings → Account type and tools, then reconnect.");
    }
    const username = String(profile.username || "").toLowerCase();

    if (!username) return fail("Instagram did not return a username.");
    if (username !== approved.username.toLowerCase()) {
      return fail(
        "You authorized @" + username + ", but this shop is approved for @" +
        approved.username + ". Please authorize the approved Instagram account."
      );
    }

    const connection = await connect(token, s.uid, exchanged.expiresAt);
    await sync(connection.id);

    const res = NextResponse.redirect(new URL("/account/setup?setup=" + encodeURIComponent(s.requestId) + "&step=4&instagram=connected", r.url));
    res.cookies.delete("instagram_oauth_state");
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (/permission|role|tester|not authorized|access denied/i.test(message)) {
      return fail("Only Instagram accounts added as testers or app roles can connect while the Meta app is in development mode. Ask the SokoLink administrator to invite your username, accept it, and try again.");
    }
    return fail(message || "Instagram connection failed. Please check that your account is a Business or Creator account.");
  }
}