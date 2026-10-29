import { NextResponse } from "next/server";
import { processMpesaCallback } from "@/lib/ai-promotion-payment";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid callback payload." }, { status: 400 }); }
  try {
    const result = await processMpesaCallback(body);
    if (!result.accepted) {
      console.error("M-Pesa callback rejected", "reason" in result ? result.reason : "Unknown callback rejection");
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Callback could not be matched to a valid transaction." }, { status: 400 });
    }
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("M-Pesa callback processing error", error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Callback processing failed." }, { status: 500 });
  }
}
