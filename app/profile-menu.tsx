import Link from "next/link";
import { signOut } from "@/app/actions";

export function ProfileMenu() {
  return (
    <details className="profile-menu">
      <summary className="app-user-dot" aria-label="Open account menu" title="Account menu">
        ♫<span className="sr-only">Account menu</span>
      </summary>
      <div className="profile-menu-panel">
        <Link href="/profile">Profile</Link>
        <Link href="/settings/profile">Settings</Link>
        <form action={signOut}>
          <button type="submit">Log out</button>
        </form>
      </div>
    </details>
  );
}
