'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';

type Wishlist = {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export default function AddToWishlistButton({ gameId }: { gameId: string }) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [creatingWishlist, setCreatingWishlist] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
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
      } catch (err) {
        console.error('Error loading wishlists:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWishlists();
  }, [currentUser]);

  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim()) {
      setError('Wishlist name is required');
      return;
    }

    setCreatingWishlist(true);
    setError('');

    try {
      const response = await fetch('/api/wishlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWishlistName,
          isPublic: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to create wishlist');

      const newWishlist = await response.json();
      setWishlists([newWishlist, ...wishlists]);
      setNewWishlistName('');
      setSuccess('Wishlist created!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wishlist');
    } finally {
      setCreatingWishlist(false);
    }
  };

  const handleAddToWishlist = async (wishlistId: string) => {
    setAddingToWishlist(true);
    setError('');

    try {
      const response = await fetch('/api/wishlists/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wishlistId,
          gameId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add to wishlist');
      }

      setSuccess('Added to wishlist!');
      setShowModal(false);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => {
          setError('');
          setSuccess('');
          setShowModal(true);
        }}
        className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-6 py-3 text-sm font-bold text-rbx-muted transition hover:text-white hover:border-rbx-orange/50 active:scale-95 focus-visible:ring-2 focus-visible:ring-rbx-orange"
      >
        ❤️ Add to Playlist
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl border border-rbx-border bg-rbx-surface max-w-md w-full p-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">Add to Playlist</h2>
              <p className="mt-1 text-sm text-rbx-muted">Add this game to one of your playlists</p>
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

            {/* Create new playlist */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">Create New Playlist</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                  placeholder="e.g., Favorites, To Play..."
                  className="flex-1 rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none"
                  maxLength={100}
                />
                <button
                  onClick={handleCreateWishlist}
                  disabled={creatingWishlist}
                  className="rounded-lg bg-rbx-surface-2 px-3 py-2 text-sm font-semibold text-rbx-muted transition hover:text-white disabled:opacity-50"
                >
                  ➕
                </button>
              </div>
            </div>

            {/* Existing playlists */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <label className="block text-sm font-semibold text-white">Add to Existing</label>
              {loading ? (
                <p className="text-sm text-rbx-muted">Loading playlists...</p>
              ) : wishlists.length > 0 ? (
                <div className="space-y-2">
                  {wishlists.map((wishlist) => (
                    <button
                      key={wishlist.id}
                      onClick={() => handleAddToWishlist(wishlist.id)}
                      disabled={addingToWishlist}
                      className="w-full text-left rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-2 text-sm transition hover:bg-rbx-surface-3 disabled:opacity-50"
                    >
                      <p className="font-semibold text-white">{wishlist.name}</p>
                      {wishlist.description && (
                        <p className="text-xs text-rbx-muted line-clamp-1">{wishlist.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-rbx-muted">Create a playlist first</p>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full rounded-lg border border-rbx-border px-4 py-2 text-sm font-semibold text-rbx-muted transition hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
