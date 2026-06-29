'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';

type Game = {
  id: string;
  title: string;
  description: string;
  roblox_url: string;
};

type WishlistItem = {
  id: string;
  game_id: string;
  added_at: string;
  games: Game;
};

type Wishlist = {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

function WishlistContent() {
  const searchParams = useSearchParams();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [newWishlistDesc, setNewWishlistDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUser({ id: data.user.id });
      }
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const loadWishlists = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/wishlists');
        if (!response.ok) throw new Error('Failed to load wishlists');
        const data = await response.json();
        setWishlists(data.wishlists || []);
        
        // Select first wishlist or the one from URL
        const urlWishlistId = searchParams.get('id');
        if (urlWishlistId && data.wishlists) {
          const wishlist = data.wishlists.find((w: Wishlist) => w.id === urlWishlistId);
          if (wishlist) {
            setSelectedWishlist(wishlist);
          } else if (data.wishlists.length > 0) {
            setSelectedWishlist(data.wishlists[0]);
          }
        } else if (data.wishlists && data.wishlists.length > 0) {
          setSelectedWishlist(data.wishlists[0]);
        }
      } catch (err) {
        console.error('Error loading wishlists:', err);
        setError('Failed to load wishlists');
      } finally {
        setLoading(false);
      }
    };

    loadWishlists();
  }, [currentUser, searchParams]);

  useEffect(() => {
    if (!selectedWishlist) return;

    const loadWishlistItems = async () => {
      try {
        const url = new URL('/api/wishlists/items', window.location.origin);
        url.searchParams.set('wishlistId', selectedWishlist.id);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load items');
        const data = await response.json();
        setWishlistItems(data.items || []);
      } catch (err) {
        console.error('Error loading items:', err);
        setError('Failed to load wishlist items');
      }
    };

    loadWishlistItems();
  }, [selectedWishlist]);

  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim()) {
      setError('Wishlist name is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/wishlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWishlistName,
          description: newWishlistDesc || undefined,
          isPublic,
        }),
      });

      if (!response.ok) throw new Error('Failed to create wishlist');

      const newWishlist = await response.json();
      setWishlists([newWishlist, ...wishlists]);
      setSelectedWishlist(newWishlist);
      setNewWishlistName('');
      setNewWishlistDesc('');
      setIsPublic(false);
      setShowCreateForm(false);
      setSuccess('Wishlist created!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wishlist');
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const response = await fetch('/api/wishlists/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlistItemId: itemId }),
      });

      if (!response.ok) throw new Error('Failed to remove item');

      setWishlistItems(wishlistItems.filter(item => item.id !== itemId));
      setSuccess('Removed from wishlist');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    }
  };

  if (!currentUser) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-rbx-border bg-rbx-surface p-10 text-center">
          <h1 className="text-3xl font-black text-white">Sign in required</h1>
          <p className="mt-3 text-sm text-rbx-muted">Please sign in to view your wishlists</p>
          <Link
            href="/auth"
            className="mt-6 inline-block rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-white">My Wishlists</h1>
          <p className="mt-2 text-sm text-rbx-muted">Save and organize your favorite Roblox games</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Wishlists Sidebar */}
          <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-4 h-fit space-y-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Wishlists</h2>
              <p className="text-xs text-rbx-muted mt-1">{wishlists.length} total</p>
            </div>

            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
              >
                ➕ New Wishlist
              </button>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleCreateWishlist(); }} className="space-y-3">
                <input
                  type="text"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                  placeholder="Wishlist name..."
                  className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none"
                  maxLength={100}
                />
                <textarea
                  value={newWishlistDesc}
                  onChange={(e) => setNewWishlistDesc(e.target.value)}
                  placeholder="Description (optional)..."
                  className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none"
                  rows={2}
                  maxLength={500}
                />
                <label className="flex items-center gap-2 text-sm text-rbx-muted">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded"
                  />
                  Make public
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 rounded-lg bg-rbx-surface px-3 py-2 text-sm font-bold text-white transition hover:bg-rbx-surface-3 disabled:opacity-50"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 rounded-lg border border-rbx-border px-3 py-2 text-sm font-bold text-rbx-muted transition hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-rbx-muted">Loading...</p>
              ) : wishlists.length > 0 ? (
                wishlists.map((wishlist) => (
                  <button
                    key={wishlist.id}
                    onClick={() => setSelectedWishlist(wishlist)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      selectedWishlist?.id === wishlist.id
                        ? 'bg-gradient-to-r from-rbx-red to-rbx-orange text-white'
                        : 'text-rbx-muted hover:text-white hover:bg-rbx-surface'
                    }`}
                  >
                    {wishlist.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-rbx-muted">No wishlists yet</p>
              )}
            </div>
          </div>

          {/* Wishlist Items */}
          <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6">
            {selectedWishlist ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white">{selectedWishlist.name}</h2>
                  {selectedWishlist.description && (
                    <p className="mt-2 text-sm text-rbx-muted">{selectedWishlist.description}</p>
                  )}
                  <p className="mt-3 text-xs text-rbx-muted">
                    {wishlistItems.length} game{wishlistItems.length !== 1 ? 's' : ''} • {selectedWishlist.is_public ? '🌍 Public' : '🔒 Private'}
                  </p>
                </div>

                {wishlistItems.length > 0 ? (
                  <div className="space-y-3">
                    {wishlistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 rounded-lg border border-rbx-border/30 bg-rbx-surface p-4"
                      >
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/game/${item.games.id}`}
                            className="font-bold text-white hover:text-rbx-orange transition"
                          >
                            {item.games.title}
                          </Link>
                          <p className="mt-1 text-sm text-rbx-muted line-clamp-2">{item.games.description}</p>
                          <p className="mt-2 text-xs text-rbx-muted">
                            Added {dateFormatter.format(new Date(item.added_at))}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <a
                            href={item.games.roblox_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-rbx-surface px-3 py-2 text-xs font-bold text-white transition hover:bg-rbx-surface-3"
                          >
                            Play
                          </a>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="rounded-lg bg-rbx-surface px-3 py-2 text-xs font-bold text-rbx-muted transition hover:text-red-400"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-rbx-border/30 bg-rbx-surface p-8 text-center">
                    <p className="text-sm text-rbx-muted">This wishlist is empty. Add games to get started!</p>
                    <Link
                      href="/"
                      className="mt-4 inline-block rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      Browse Games
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-rbx-muted">Create a wishlist to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function WishlistPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="h-96 animate-pulse rounded-lg border border-rbx-border bg-rbx-surface" />
      </main>
    }>
      <WishlistContent />
    </Suspense>
  );
}
