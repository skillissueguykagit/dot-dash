"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="px-3 py-2 rounded-lg text-sm font-semibold text-text-dim hover:bg-bg-elev-2"
    >
      Sign out
    </button>
  );
}
