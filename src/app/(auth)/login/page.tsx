"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);
    if (signInError) {
      setError("Nieprawidlowy e-mail lub haslo.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <Card className="w-full max-w-md">
      <div className="flex items-center gap-3">
        <Image
          src="/branding/sygnet1.png"
          alt="Logo LOLA"
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
          priority
        />
        <h1 className="font-[var(--font-heading)] text-4xl">LOLA Client Hub</h1>
      </div>
      <p className="mt-2 text-sm text-muted">Zaloguj sie, aby kontynuowac</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">E-mail</label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Haslo</label>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Logowanie..." : "Zaloguj"}
        </Button>
      </form>
    </Card>
  );
}
