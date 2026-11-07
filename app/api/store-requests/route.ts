import { NextResponse } from "next/server";
import { user } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function POST(r: Request) {
  const u = await user();
  if (!u) return NextResponse.redirect(new URL("/login", r.url));

  const f = await r.formData();
  if (f.get("intent") === "cancel") {
    const requestId = String(f.get("requestId") || "");
    if (requestId) {
      const storeRequest = await db().storeRequest.findFirst({
        where: { id: requestId, userId: u.id },
      });
      if (storeRequest) {
        const connection = await db().instagramConnection.findFirst({
          where: { username: { equals: storeRequest.username, mode: "insensitive" } },
          select: { id: true },
        });
        if (!connection) {
          await db().storeRequest.deleteMany({
            where: { id: storeRequest.id, userId: u.id },
          });
        }
      }
    }
    return NextResponse.redirect(new URL("/account?requestCancelled=1", r.url));
  }

  const flow = f.get("flow") === "page" ? "page" : "account";
  if (f.get("businessCreatorConfirmed") !== "on") {
    return NextResponse.redirect(new URL(flow === "page" ? "/account/setup?step=1&error=account_type" : "/account?step=1&error=account_type", r.url));
  }
  const username = String(f.get("username") || "").replace(/^@/, "").trim().toLowerCase();
  if (!/^[a-z0-9._]{1,30}$/i.test(username)) {
    return NextResponse.redirect(new URL(f.get("flow") === "page" ? "/account/setup?step=1&error=invalid" : "/account?step=1&error=invalid", r.url));
  }
  const created = await db().storeRequest.create({ data: { userId: u.id, username } });
  return NextResponse.redirect(new URL((f.get("flow") === "page" ? "/account/setup?setup=" : "/account?setup=") + encodeURIComponent(created.id) + "&step=2&requested=1", r.url));
}