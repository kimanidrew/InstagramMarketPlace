import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { userFriendlyError } from "@/lib/user-friendly-errors";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }
    const account = await signIn(email, password);
    if (!account) return NextResponse.json({ error: userFriendlyError("invalid credentials", "auth") }, { status: 401 });
    return NextResponse.json({ ok: true, redirect: account.role === "ADMIN" ? "/admin" : "/account" });
  } catch (error) {
    console.error("Sign-in request failed", error);
    return NextResponse.json({ error: userFriendlyError(error, "auth") }, { status: 500 });
  }
}
