'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function SearchBar() {
  const [searchInput, setSearchInput] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput)}`);
      setSearchInput('');
    }
  };

  return (
    <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-2 flex-1 max-w-xs">
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search games..."
        className="w-full rounded-lg border border-rbx-border bg-rbx-surface-2 px-4 py-2 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange/50"
      />
      <button
        type="submit"
        className="rounded-lg bg-rbx-surface-2 px-3 py-2 text-sm font-semibold text-rbx-muted transition hover:text-white border border-rbx-border hover:border-rbx-orange focus-visible:ring-2 focus-visible:ring-rbx-orange"
        aria-label="Search"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>
    </form>
  );
}
