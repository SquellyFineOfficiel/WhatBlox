'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';

type Review = {
  id: string;
  game_id: string;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  helpful_count: number;
  unhelpful_count: number;
  created_at: string;
  updated_at: string;
  reviewer?: {
    display_name: string;
    avatar_url: string | null;
  };
};

type ReviewsResponse = {
  reviews: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage: number;
  };
  stats: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  };
  sort: string;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default function ReviewsSection({ gameId, robloxUrl }: { gameId: string; robloxUrl: string }) {
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; user_metadata?: { roblox_username?: string } } | null>(null);
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [hasPlayedGame, setHasPlayedGame] = useState(false);
  const [checkingPlayStatus, setCheckingPlayStatus] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUser({ 
          id: data.user.id,
          user_metadata: data.user.user_metadata as any
        });
      }
    });
  }, []);

  // Check if user has played the game
  useEffect(() => {
    const checkPlayStatus = async () => {
      if (!currentUser?.user_metadata?.roblox_username) {
        setCheckingPlayStatus(false);
        return;
      }

      try {
        setCheckingPlayStatus(true);
        // Extract game ID from roblox_url (e.g., https://www.roblox.com/games/123456 -> 123456)
        const gameIdMatch = robloxUrl.match(/\/games\/(\d+)/);
        if (!gameIdMatch) {
          setCheckingPlayStatus(false);
          return;
        }

        const robloxGameId = gameIdMatch[1];
        const username = currentUser.user_metadata.roblox_username;

        // Call our API endpoint to check if user has played the game
        const response = await fetch('/api/roblox/player-games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, robloxGameId }),
        });

        if (response.ok) {
          const data = await response.json();
          setHasPlayedGame(data.hasPlayed);
        }
      } catch (err) {
        console.error('Error checking play status:', err);
      } finally {
        setCheckingPlayStatus(false);
      }
    };

    checkPlayStatus();
  }, [currentUser, robloxUrl]);

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      try {
        const url = new URL('/api/reviews', window.location.origin);
        url.searchParams.set('gameId', gameId);
        url.searchParams.set('sort', sort);
        url.searchParams.set('page', page.toString());

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load reviews');

        const data: ReviewsResponse = await response.json();
        setReviewsData(data);

        // Check if current user has reviewed this game
        if (currentUser) {
          const userRev = data.reviews.find(r => r.user_id === currentUser.id);
          setUserReview(userRev || null);
        }
      } catch (err) {
        console.error('Error loading reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [gameId, sort, page, currentUser]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please sign in to leave a review');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          rating: formData.rating,
          title: formData.title,
          content: formData.content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess('Review submitted successfully!');
      setFormData({ rating: 5, title: '', content: '' });
      setShowForm(false);

      // Reload reviews
      const url = new URL('/api/reviews', window.location.origin);
      url.searchParams.set('gameId', gameId);
      const reviewsResponse = await fetch(url);
      const newData: ReviewsResponse = await reviewsResponse.json();
      setReviewsData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpfulVote = async (reviewId: string, isHelpful: boolean) => {
    if (!currentUser) {
      setError('Please sign in to vote');
      return;
    }

    try {
      const response = await fetch('/api/reviews/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, isHelpful }),
      });

      if (!response.ok) throw new Error('Failed to record vote');

      // Reload reviews
      const url = new URL('/api/reviews', window.location.origin);
      url.searchParams.set('gameId', gameId);
      url.searchParams.set('sort', sort);
      url.searchParams.set('page', page.toString());

      const reviewsResponse = await fetch(url);
      const newData: ReviewsResponse = await reviewsResponse.json();
      setReviewsData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote');
    }
  };

  return (
    <div className="space-y-6">
      <div aria-live="polite" className="sr-only">
        {error || success}
      </div>
      <div className="border-b border-rbx-border pb-6">
        <h2 className="text-xl font-black text-white">Reviews & Ratings</h2>
        <p className="mt-1 text-sm text-rbx-muted">See what other players think about this game</p>
      </div>

      {/* Rating Stats */}
      {reviewsData && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-black text-white">
                {reviewsData.stats.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-rbx-muted">/ 5.0</span>
            </div>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={i <= Math.round(reviewsData.stats.averageRating) ? 'text-rbx-orange text-lg' : 'text-rbx-muted/30 text-lg'}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-xs text-rbx-muted">
              {reviewsData.stats.totalReviews} review{reviewsData.stats.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6 space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviewsData.stats.ratingDistribution[rating] || 0;
              const percentage = reviewsData.stats.totalReviews > 0 
                ? (count / reviewsData.stats.totalReviews) * 100 
                : 0;
              return (
                <div key={rating} className="flex items-center gap-3 text-xs">
                  <span className="w-6 font-semibold text-rbx-muted">{rating}★</span>
                  <div className="flex-1 h-2 bg-rbx-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rbx-orange to-rbx-red transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-rbx-muted">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Form */}
      {!userReview && (
        <div>
          {!currentUser ? (
            <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6 text-center">
              <p className="text-sm text-rbx-muted mb-4">Sign in to leave a review</p>
              <Link href="/auth" className="inline-block rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-2 text-sm font-bold text-white transition hover:opacity-90">
                Sign In →
              </Link>
            </div>
          ) : !hasPlayedGame && !checkingPlayStatus ? (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
              <p className="text-xs text-orange-400">
                ⚠️ Play this game first to leave a review
              </p>
            </div>
          ) : checkingPlayStatus ? (
            <div className="rounded-lg bg-rbx-surface-2 px-4 py-3 text-xs text-rbx-muted">
              Checking if you've played…
            </div>
          ) : (
            <>
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  ✍️ Write Review
                </button>
              ) : (
                <form onSubmit={handleSubmitReview} className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-5 space-y-4">
                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-400">
                      {success}
                    </div>
                  )}

                  <fieldset>
                    <legend className="block text-xs font-semibold text-white mb-2">Rating</legend>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          aria-label={`Set rating to ${rating} star${rating === 1 ? '' : 's'}`}
                          onClick={() => setFormData({ ...formData, rating })}
                          className={`text-2xl transition ${
                            rating <= formData.rating ? 'text-rbx-orange' : 'text-rbx-muted hover:text-white'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div>
                    <label htmlFor="review-title" className="block text-xs font-semibold text-white mb-2">Title</label>
                    <input
                      id="review-title"
                      type="text"
                      name="reviewTitle"
                      autoComplete="off"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Summarize your experience…"
                      className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange"
                      maxLength={200}
                    />
                    <p className="mt-1 text-xs text-rbx-muted text-right">{formData.title.length}/200</p>
                  </div>

                  <div>
                    <label htmlFor="review-content" className="block text-xs font-semibold text-white mb-2">Review</label>
                    <textarea
                      id="review-content"
                      name="reviewContent"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Share your thoughts…"
                      className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange resize-none"
                      rows={4}
                      maxLength={5000}
                    />
                    <p className="mt-1 text-xs text-rbx-muted text-right">{formData.content.length}/5000</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting…' : 'Submit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setError('');
                        setSuccess('');
                      }}
                      className="flex-1 rounded-lg border border-rbx-border px-4 py-2 text-sm font-bold text-rbx-muted transition hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div>
        {reviewsData && reviewsData.reviews.length > 0 ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <label htmlFor="reviews-sort" className="text-xs font-semibold text-rbx-muted">Sort:</label>
              <select
                id="reviews-sort"
                name="reviewsSort"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-rbx-border bg-rbx-surface px-3 py-1.5 text-xs text-white focus:border-rbx-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-rbx-orange"
              >
                <option value="recent">Recent</option>
                <option value="helpful">Most Helpful</option>
                <option value="rating_high">Highest Rated</option>
                <option value="rating_low">Lowest Rated</option>
              </select>
            </div>

            <div className="space-y-3">
              {reviewsData.reviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span
                            key={i}
                            className={`text-sm ${i <= review.rating ? 'text-rbx-orange' : 'text-rbx-muted/30'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <h3 className="font-semibold text-white text-sm">{review.title}</h3>
                    </div>
                    <span className="text-xs text-rbx-muted shrink-0">{dateFormatter.format(new Date(review.created_at))}</span>
                  </div>
                  <p className="text-xs text-rbx-muted mb-1">
                    By {review.reviewer?.display_name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-rbx-muted leading-relaxed mb-3">{review.content}</p>

                  <div className="flex items-center gap-2 pt-3 border-t border-rbx-border/30">
                    <button
                      onClick={() => handleHelpfulVote(review.id, true)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-rbx-muted transition hover:text-white hover:bg-rbx-surface"
                    >
                      👍 {review.helpful_count}
                    </button>
                    <button
                      onClick={() => handleHelpfulVote(review.id, false)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-rbx-muted transition hover:text-white hover:bg-rbx-surface"
                    >
                      👎 {review.unhelpful_count}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {reviewsData.pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {page > 1 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="rounded border border-rbx-border px-2 py-1 text-xs font-semibold text-rbx-muted transition hover:text-white"
                  >
                    ← Prev
                  </button>
                )}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(reviewsData.pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`rounded px-2 py-1 text-xs font-semibold transition ${
                        p === page
                          ? 'bg-gradient-to-r from-rbx-red to-rbx-orange text-white'
                          : 'border border-rbx-border text-rbx-muted hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                {page < reviewsData.pagination.totalPages && (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="rounded border border-rbx-border px-2 py-1 text-xs font-semibold text-rbx-muted transition hover:text-white"
                  >
                    Next →
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6 text-center">
            <p className="text-sm text-rbx-muted">No reviews yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}
