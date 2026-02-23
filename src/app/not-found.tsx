import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="rounded-xl border border-line bg-panel/90 p-6 text-center shadow-card">
        <h1 className="font-[var(--font-heading)] text-4xl">404</h1>
        <p className="mt-2 text-sm text-muted">Nie znaleziono strony.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-md border border-line bg-black/20 px-4 py-2 text-sm hover:border-accent hover:text-[#fcf8f0]"
        >
          Wroc do panelu
        </Link>
      </div>
    </main>
  );
}
