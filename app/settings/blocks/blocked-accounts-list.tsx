"use client";

import { useState } from "react";
import { unblockUser } from "../../actions";

export type BlockedAccount = {
  id: string;
  username: string | null;
  displayName: string | null;
  specialty: string | null;
  avatarDoodle: string | null;
  createdAt: string;
};

export function BlockedAccountsList({ accounts }: { accounts: BlockedAccount[] }) {
  const [selected, setSelected] = useState<BlockedAccount | null>(null);
  const targetName = selected?.username ? `@${selected.username}` : "this account";

  return <>
    {selected && <>
      <button className="unblock-sheet-scrim" aria-label="Close unblock confirmation" onClick={() => setSelected(null)} />
      <section className="unblock-confirmation" aria-labelledby="unblock-confirm-title">
        <div className="unblock-confirm-grabber" aria-hidden="true" />
        <div className="unblock-confirm-heading"><span aria-hidden="true">↻</span><div><small>CHANNEL CLEARANCE</small><h2 id="unblock-confirm-title">Unblock {targetName}?</h2></div></div>
        <p>They will be able to see your public profile and open opportunities again. New proposals and applications between you will be allowed.</p>
        <div className="unblock-confirm-summary"><span>TARGET ACCOUNT <b>{selected.displayName ?? targetName}</b></span><span>ACCESS <b>PUBLIC PROFILE &amp; OPEN OPPORTUNITIES</b></span></div>
        <div className="unblock-confirm-actions"><button type="button" className="unblock-cancel" onClick={() => setSelected(null)}>Cancel</button><form action={unblockUser}><input type="hidden" name="blockedId" value={selected.id} /><button className="unblock-confirm-button" type="submit">✓ Confirm unblock</button></form></div>
      </section>
    </>}

    {accounts.length ? <div className="blocked-account-list">
      {accounts.map((account) => <article className="blocked-account-card" key={account.id}>
        <div className={`blocked-account-avatar profile-doodle ${account.avatarDoodle ?? "note-1"}`}><span aria-hidden="true">♫</span></div>
        <div className="blocked-account-info"><div className="blocked-account-name"><strong>{account.username ? `@${account.username}` : "Blocked account"}</strong><span>RESTRICTED</span></div><p>{account.displayName ?? "Profile details are unavailable"}{account.specialty ? ` · ${account.specialty}` : ""}</p><small>Blocked {new Date(account.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · Profile and new interactions restricted</small></div>
        <button type="button" className="blocked-account-unblock" onClick={() => setSelected(account)}>♧ Unblock</button>
        <div className="blocked-account-mobile-status"><span>⊘ INBOUND RESTRICTED</span><span>ID · {account.id.slice(0, 8).toUpperCase()}</span></div>
      </article>)}
    </div> : <section className="blocked-empty-state"><span aria-hidden="true">♙</span><small>CLEAR DIRECTORY</small><h2>No blocked accounts</h2><p>You haven’t blocked any musicians. Accounts on Muxics can interact with your profile and open opportunities according to your visibility settings.</p><span className="blocked-empty-status">● Directory access normal</span></section>}
  </>;
}
