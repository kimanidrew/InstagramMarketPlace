import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }
    const account = await signIn(email, password);
    if (!account) return NextResponse.json({ error: "That email and password don't match. Please try again." }, { status: 401 });
    return NextResponse.json({ ok: true, redirect: account.role === "ADMIN" ? "/admin" : "/account" });
  } catch {
    return NextResponse.json({ error: "We couldn't sign you in right now. Please try again." }, { status: 500 });
  }
}
