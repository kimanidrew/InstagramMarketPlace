import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { dec, ig } from "@/lib/instagram";

export const dynamic = "force-dynamic";

type InstagramComment = {
  id: string;
  text?: string;
  username?: string;
  timestamp?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  if (!postId) return NextResponse.json({ comments: [], error: "Missing post ID." }, { status: 400 });

  const post = await db().instagramPost.findFirst({
    where: { id: postId, isProduct: true },
    select: {
      id: true,
      connection: { select: { encryptedToken: true } },
    },
  });

  if (!post) return NextResponse.json({ comments: [] }, { status: 404 });

  try {
    const token = dec(post.connection.encryptedToken);
    const result = await ig<{ data?: InstagramComment[] }>(
      token,
      post.id + "/comments",
      { fields: "id,text,username,timestamp", limit: "50" },
    );

    const comments = (result.data || [])
      .filter((comment) => typeof comment.text === "string" && comment.text.trim())
      .map((comment) => ({
        id: comment.id,
        text: comment.text!.trim(),
        username: comment.username || "Instagram user",
        timestamp: comment.timestamp || null,
      }));

    return NextResponse.json({ comments });
  } catch (error) {
    // Keep the product page available when Instagram's comments edge is unavailable.
    console.error("Could not fetch Instagram product comments", {
      postId,
      error: error instanceof Error ? error.message : "Unknown Instagram API error",
    });
    return NextResponse.json({
      comments: [],
      unavailable: true,
      message: "Instagram comments are temporarily unavailable.",
    });
  }
}
