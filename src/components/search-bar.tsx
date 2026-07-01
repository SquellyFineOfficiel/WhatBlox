'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [searchInput, setSearchInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const shouldAutoFocus =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (shouldAutoFocus) {
      inputRef.current?.focus();
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput)}`);
      setSearchInput('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-rbx-border bg-rbx-surface-2 text-rbx-muted transition hover:border-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange"
        aria-label={isOpen ? 'Close search' : 'Open search'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>
      {isOpen ? (
        <form
          ref={formRef}
          onSubmit={handleSearch}
          className="absolute right-0 top-12 z-40 w-[min(88vw,420px)] rounded-2xl border border-rbx-border bg-rbx-surface p-3 shadow-2xl"
        >
          <input
            ref={inputRef}
            type="text"
            name="q"
            autoComplete="off"
            aria-label="Search games"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search games"
            className="w-full rounded-xl border border-rbx-border bg-rbx-surface-2 px-4 py-2.5 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange/40"
          />
        </form>
      ) : null}
    </div>
  );
}
