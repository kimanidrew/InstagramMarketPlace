"use client";

import { XCircle } from "lucide-react";

export function AccountTerminateStoreForm({ connectionId, username }: { connectionId: string; username: string }) {
  function confirmTermination(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm("Terminate @" + username + "? This disconnects the Instagram shop and permanently removes its marketplace listings, reviews, and related shop data. You can reconnect it later by starting setup again.")) {
      event.preventDefault();
    }
  }

  return (
    <form action="/api/account/terminate-store" method="post" onSubmit={confirmTermination}>
      <input type="hidden" name="connectionId" value={connectionId} />
      <button type="submit" className="account-terminate-store"><XCircle size={14} /> Terminate shop</button>
    </form>
  );
}
