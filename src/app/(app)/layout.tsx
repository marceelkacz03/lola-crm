import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { requireUserContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUserContext();

  const signOut = async () => {
    "use server";
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  return (
    <div className="app-shell min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <AppSidebar role={user.role} email={user.email} className="hidden lg:flex" />
      <main className="min-h-screen p-4 lg:p-8">
        <header className="mb-6 flex items-center justify-between lg:justify-end">
          <MobileNav role={user.role} email={user.email} />
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Wyloguj
            </Button>
          </form>
        </header>
        {children}
      </main>
    </div>
  );
}
