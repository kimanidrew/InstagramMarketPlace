import { admin } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, CircleAlert, ExternalLink, Image, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import AdminWorkspaceNav from "@/components/admin-workspace-nav";

export const dynamic = "force-dynamic";

export default async function WhatsAppSetupPage() {
  try {
    await admin();
  } catch {
    redirect("/login");
  }

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")).replace(/\\/$/, "");
  const webhookUrl = origin ? `${origin}/api/whatsapp/webhook` : "";
  const checks = [
    { label: "Cloud API access token", key: "WHATSAPP_ACCESS_TOKEN", required: true },
    { label: "Phone number ID", key: "WHATSAPP_PHONE_NUMBER_ID", required: true },
    { label: "Webhook verify token", key: "WHATSAPP_VERIFY_TOKEN", required: true },
    { label: "Meta app secret (signature validation)", key: "WHATSAPP_APP_SECRET", required: true },
    { label: "Public site URL", key: "NEXT_PUBLIC_SITE_URL", required: true },
    { label: "OpenAI API key (AI query understanding)", key: "OPENAI_API_KEY", required: false },
  ];
  let conversationCount: number | null = null;
  let messageCount: number | null = null;
  try {
    const p = db();
    [conversationCount, messageCount] = await Promise.all([
      p.whatsAppConversation.count(),
      p.whatsAppMessage.count(),
    ]);
  } catch {
    // A missing/unmigrated database should not prevent the admin checklist from rendering.
  }
  const missingRequired = checks.filter((item) => item.required && !process.env[item.key]).length;

  return (
    <div className="admin-workspace">
      <AdminWorkspaceNav />
      <main className="admin-page">
        <div className="shell py-10 md:py-12">
          <header className="admin-head">
            <div>
              <p className="account-kicker dark">Channel setup</p>
              <h1>SokoLink on WhatsApp</h1>
              <p>Check server configuration, connect Meta webhooks, and deliver real listing photos in customer chats.</p>
            </div>
            <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" className="admin-top-button">Open Meta Developers <ExternalLink size={14} /></a>
          </header>

          <section className="admin-overview-grid">
            <article className="admin-meta-card">
              <div className="admin-meta-icon"><MessageCircle size={22} /></div>
              <div>
                <p className="account-kicker dark">Webhook callback URL</p>
                {webhookUrl ? <p className="break-all font-bold">{webhookUrl}</p> : <p className="font-bold text-red-600">Set NEXT_PUBLIC_SITE_URL to your production origin.</p>}
                <p>Paste this URL into Meta for Developers → WhatsApp → Configuration. Set the verify token there to the exact value of WHATSAPP_VERIFY_TOKEN.</p>
              </div>
            </article>
            <article className="admin-overview-note">
              <span className="admin-overview-note-icon"><Image size={18} /></span>
              <div>
                <b>Product photos in chat</b>
                <p>Search results are sent as WhatsApp image messages using the listing's public HTTPS image URL. Video listings use thumbnails; inaccessible images fall back to a text result and listing link.</p>
              </div>
            </article>
          </section>

          <section className="mt-8 rounded-3xl border border-black/10 bg-white p-5 md:p-7">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck size={21} />
              <div><h2 className="text-xl font-black">Environment readiness</h2><p className="text-sm text-neutral-500">Only presence is shown; secret values are never displayed.</p></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {checks.map((item) => {
                const configured = Boolean(process.env[item.key]?.trim());
                return <div key={item.key} className="flex items-start gap-3 rounded-2xl border border-black/10 p-4">
                  {configured ? <CheckCircle2 size={19} className="mt-0.5 text-emerald-600" /> : <CircleAlert size={19} className="mt-0.5 text-amber-600" />}
                  <div className="min-w-0"><p className="font-bold">{item.label}</p><p className="break-all text-xs text-neutral-500">{item.key}</p><p className="mt-1 text-xs font-semibold">{configured ? "Configured" : item.required ? "Required — missing" : "Optional — not configured"}</p></div>
                </div>;
              })}
            </div>
            <p className="mt-4 text-sm text-neutral-600">{missingRequired === 0 ? "Required variables are present. You still need to verify the webhook in Meta and send a real test message." : `${missingRequired} required variable(s) still need to be added in Vercel/local environment settings.`}</p>
          </section>

          <section className="mt-8 rounded-3xl border border-black/10 bg-white p-5 md:p-7">
            <div className="mb-5 flex items-center gap-3"><Sparkles size={21} /><div><h2 className="text-xl font-black">Finish setup step by step</h2><p className="text-sm text-neutral-500">Meta account actions must be completed by you.</p></div></div>
            <ol className="space-y-5">
              {[
                ["Add environment variables", "Add the required values above in Vercel → Project → Settings → Environment Variables, then redeploy. Use the same values in .env.local for local testing."],
                ["Open WhatsApp setup in Meta", "In Meta for Developers, open your app and add/configure the WhatsApp product. Use the test number first if you are still setting up your business number."],
                ["Verify the webhook", "Set the callback URL shown above, paste the exact WHATSAPP_VERIFY_TOKEN value, verify, then subscribe to the messages webhook field."],
                ["Confirm permissions and number", "Ensure the token has WhatsApp messaging permission and that WHATSAPP_PHONE_NUMBER_ID belongs to the intended sender number. Add your own phone as a test recipient if Meta requires it."],
                ["Test image delivery", "Message the WhatsApp number with a listing search such as “dress” or “cake”. Confirm a matching listing photo appears as an image message and that its SokoLink link opens."],
                ["Prepare for production", "Set up a suitable long-lived/system-user token, complete any Meta business verification/app review requirements shown in your dashboard, and review WhatsApp's messaging policies and charges."],
              ].map(([title, description], index) => <li key={title} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-sm font-black text-white">{index + 1}</span><div><p className="font-bold">{title}</p><p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p></div></li>)}
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/overview" target="_blank" rel="noreferrer" className="admin-secondary-button">Cloud API guide <ExternalLink size={14} /></a>
              <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks" target="_blank" rel="noreferrer" className="admin-secondary-button">Webhook guide <ExternalLink size={14} /></a>
              <Link href="/admin" className="admin-secondary-button">Back to admin dashboard</Link>
            </div>
          </section>

          <section className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="admin-stat"><MessageCircle size={19} /><b>{conversationCount === null ? "—" : conversationCount}</b><span>WhatsApp conversations recorded</span></div>
            <div className="admin-stat"><CheckCircle2 size={19} /><b>{messageCount === null ? "—" : messageCount}</b><span>WhatsApp messages recorded</span></div>
          </section>
        </div>
      </main>
    </div>
  );
}
