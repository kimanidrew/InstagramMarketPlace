import { NextResponse } from "next/server";
import { signUp } from "@/lib/auth";
import { userFriendlyError } from "@/lib/user-friendly-errors";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || typeof password !== "string") {
      return NextResponse.json({ error: "Please complete all fields." }, { status: 400 });
    }
    const account = await signUp(name, email, password);
    return NextResponse.json({ ok: true, redirect: account.role === "ADMIN" ? "/admin" : "/account" });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const message = userFriendlyError(error, "auth");
    const status = /already exists/i.test(rawMessage) ? 409 : /at least 8 characters/i.test(rawMessage) ? 400 : 500;
    if (status === 500) console.error("Sign-up request failed", error);
    return NextResponse.json({ error: message }, { status });
  }
}
