import { NextResponse } from "next/server";
import { signUp } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || typeof password !== "string") {
      return NextResponse.json({ error: "Please complete all fields." }, { status: 400 });
    }
    const account = await signUp(name, email, password);
    return NextResponse.json({ ok: true, redirect: account.role === "ADMIN" ? "/admin" : "/account" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign up failed. Please try again.";
    const status = /already exists/i.test(message) ? 409 : /at least 8 characters/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
