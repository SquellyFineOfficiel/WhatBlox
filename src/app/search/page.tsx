'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getRobloxGameMetadata, type RobloxMetadata, formatStat } from '@/src/lib/roblox';
import { createClient } from '@/src/lib/supabase/client';

type Game = {
  id: string;
  title: string;
  description: string;
  roblox_url: string;
  created_at: string;
  user_id: string;
};

type Vote = {
  id: string;
  game_id: string;
  value: number;
};

type SearchResponse = {
  games: Game[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage: number;
  };
  query: string;
  sortBy: string;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

function SearchContent() {
  const searchParams = useSearchParams();
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votes, setVotes] = useState<Record<string, Vote>>({});
  const [metadataMap, setMetadataMap] = useState<Record<string, RobloxMetadata | null>>({});
  const [clientUser, setClientUser] = useState<{ id: string } | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setClientUser({ id: data.user.id });
      }
    });
  }, []);

  useEffect(() => {
    const loadSearchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const url = new URL('/api/search', window.location.origin);
        url.searchParams.set('q', query);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('sort', sortBy);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }

        const data: SearchResponse = await response.json();
        setSearchData(data);

        // Load votes for current user
        if (clientUser?.id) {
          const supabase = createClient();
          if (supabase) {
            const { data: voteData } = await supabase
              .from('votes')
              .select('id,game_id,value')
              .eq('user_id', clientUser.id);
            const voteMap = Object.fromEntries(
              (voteData ?? []).map((vote: Vote) => [vote.game_id, vote])
            );
            setVotes(voteMap);
          }
        }
      } catch (err) {
        setError('Failed to load search results. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSearchResults();
  }, [query, page, sortBy, clientUser?.id]);

  useEffect(() => {
    let ignore = false;

    const loadMetadata = async () => {
      if (!searchData?.games) return;
      const metadataEntries = await Promise.all(
        searchData.games.map(
          async (game) => [game.id, await getRobloxGameMetadata(game.roblox_url)] as const
        )
      );
      const nextMetadata = Object.fromEntries(metadataEntries);
      if (!ignore) {
        setMetadataMap(nextMetadata);
      }
    };

    loadMetadata();
    return () => {
      ignore = true;
    };
  }, [searchData?.games]);

  const handleVote = async (gameId: string, value: number) => {
    if (!clientUser) {
      setError('Sign in to vote on games');
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    const existing = votes[gameId];
    if (existing?.value === value) {
      await supabase.from('votes').delete().eq('id', existing.id);
      setVotes((prev) => {
        const next = { ...prev };
        delete next[gameId];
        return next;
      });
      return;
    }

    if (existing) {
      await supabase.from('votes').update({ value }).eq('id', existing.id);
      setVotes((prev) => ({ ...prev, [gameId]: { ...existing, value } }));
      return;
    }

    const { data, error: voteError } = await supabase
      .from('votes')
      .insert({ game_id: gameId, user_id: clientUser.id, value })
      .select()
      .single();

    if (!voteError && data) {
      setVotes((prev) => ({ ...prev, [gameId]: data as Vote }));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const url = new URL('/search', window.location.origin);
      url.searchParams.set('q', searchInput);
      window.location.href = url.toString();
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
      {/* Search Header */}
      <section className="space-y-6">
        <div>
          <h1 className="text-4xl font-black text-white">Search Games</h1>
          <p className="mt-2 text-sm text-rbx-muted">
            {searchData && `Found ${searchData.pagination.totalResults} game${searchData.pagination.totalResults !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchInput || query}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search for games..."
            className="flex-1 rounded-xl border border-rbx-border bg-rbx-surface px-5 py-3 text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange"
          />
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
          >
            Search
          </button>
        </form>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-rbx-muted">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white focus:border-rbx-orange focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="trending">Trending</option>
          </select>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Search Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-rbx-border bg-rbx-surface" />
          ))}
        </div>
      ) : !searchData?.games?.length ? (
        <div className="rounded-2xl border border-rbx-border bg-rbx-surface p-8 text-center">
          <h3 className="text-lg font-bold text-white">No games found</h3>
          <p className="mt-2 text-sm text-rbx-muted">
            {query ? `Try searching with different keywords` : 'Start by entering a search term'}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Back to Home
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {searchData.games.map((game) => {
            const metadata = metadataMap[game.id];
            const userVote = votes[game.id];
            return (
              <article
                key={game.id}
                className="group relative overflow-hidden rounded-2xl border border-rbx-border bg-rbx-surface transition hover:border-rbx-border hover:bg-rbx-surface-2 hover:-translate-y-px"
              >
                <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-rbx-purple via-rbx-red to-rbx-orange" />

                <div className="flex flex-col gap-5 pl-6 pr-6 py-6 sm:flex-row sm:items-center">
                  {/* Thumbnail */}
                  <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-rbx-surface-3 sm:w-40">
                    {metadata?.thumbnail_url ? (
                      <img
                        src={metadata.thumbnail_url}
                        alt={game.title}
                        width={640}
                        height={360}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rbx-surface-2 to-rbx-surface-3 text-sm font-black text-rbx-muted">
                        RBX
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-white leading-tight">
                        {metadata?.title || game.title}
                      </h3>
                      <span className="text-xs text-rbx-muted shrink-0 pt-1">
                        {dateFormatter.format(new Date(game.created_at))}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-rbx-muted line-clamp-2 leading-relaxed">
                      {metadata?.description || game.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-1.5 text-white font-medium">
                        👥 {formatStat(metadata?.player_count)}
                      </span>
                      <span className="rounded-lg border border-rbx-border bg-rbx-surface-2 px-3 py-1.5 text-white font-medium">
                        🎮 {formatStat(metadata?.visits)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {/* Vote widget */}
                      <div className="flex items-center overflow-hidden rounded-lg border border-rbx-border bg-rbx-surface-2">
                        <button
                          type="button"
                          aria-label={`Upvote ${metadata?.title || game.title}`}
                          onClick={() => handleVote(game.id, 1)}
                          className={`px-4 py-2 text-sm font-bold transition hover:bg-rbx-surface-3 focus-visible:ring-2 focus-visible:ring-rbx-orange ${
                            userVote?.value === 1 ? 'text-rbx-orange' : 'text-rbx-muted'
                          }`}
                        >
                          ▲
                        </button>
                        <span className="border-x border-rbx-border px-4 py-2 text-sm font-black text-white min-w-[2.5rem] text-center">
                          {userVote?.value ?? 0}
                        </span>
                        <button
                          type="button"
                          aria-label={`Downvote ${metadata?.title || game.title}`}
                          onClick={() => handleVote(game.id, -1)}
                          className={`px-4 py-2 text-sm font-bold transition hover:bg-rbx-surface-3 focus-visible:ring-2 focus-visible:ring-rbx-orange ${
                            userVote?.value === -1 ? 'text-rbx-red' : 'text-rbx-muted'
                          }`}
                        >
                          ▼
                        </button>
                      </div>
                      <a
                        href={game.roblox_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-5 py-2 text-xs font-bold text-white transition hover:opacity-90"
                      >
                        ▶ Play
                      </a>
                      <Link
                        href={`/game/${game.id}`}
                        className="rounded-lg border border-rbx-border px-5 py-2 text-xs font-semibold text-rbx-muted transition hover:text-white hover:border-white/20 focus-visible:ring-2 focus-visible:ring-rbx-orange"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {searchData && searchData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}&sort=${sortBy}`}
              className="rounded-lg border border-rbx-border px-4 py-2 text-sm font-semibold text-rbx-muted transition hover:text-white hover:border-white/20"
            >
              ← Previous
            </Link>
          )}

          <div className="flex items-center gap-1">
            {[...Array(searchData.pagination.totalPages)].map((_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === page;
              return (
                <Link
                  key={pageNum}
                  href={`/search?q=${encodeURIComponent(query)}&page=${pageNum}&sort=${sortBy}`}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-rbx-red to-rbx-orange text-white'
                      : 'border border-rbx-border text-rbx-muted hover:text-white hover:border-white/20'
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
          </div>

          {page < searchData.pagination.totalPages && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}&sort=${sortBy}`}
              className="rounded-lg border border-rbx-border px-4 py-2 text-sm font-semibold text-rbx-muted transition hover:text-white hover:border-white/20"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-rbx-border bg-rbx-surface" />
          ))}
        </div>
      </main>
    }>
      <SearchContent />
    </Suspense>
  );
}
