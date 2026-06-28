import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-16">
      <div className="overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface text-center">
        <div className="h-1 w-full bg-gradient-to-r from-rbx-purple via-rbx-red to-rbx-orange" />
        <div className="p-8">
          <p className="text-4xl font-black bg-gradient-to-r from-rbx-red to-rbx-orange bg-clip-text text-transparent">404</p>
          <h1 className="mt-2 text-2xl font-black text-white">Game not found</h1>
          <p className="mt-3 text-sm text-rbx-muted">The game you are looking for does not exist or may have been removed.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
