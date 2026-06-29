'use client';

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
    <div className="mt-12 space-y-8">
      <div className="border-t border-rbx-border pt-8">
        <h2 className="text-2xl font-black text-white">Reviews & Ratings</h2>

        {/* Rating Stats */}
        {reviewsData && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">
                  {reviewsData.stats.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-rbx-muted">out of 5</span>
              </div>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={i <= Math.round(reviewsData.stats.averageRating) ? 'text-rbx-orange' : 'text-rbx-muted'}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-rbx-muted">
                Based on {reviewsData.stats.totalReviews} review{reviewsData.stats.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviewsData.stats.ratingDistribution[rating] || 0;
                const percentage = reviewsData.stats.totalReviews > 0 
                  ? (count / reviewsData.stats.totalReviews) * 100 
                  : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="w-8 text-sm font-semibold text-rbx-muted">{rating}★</span>
                    <div className="flex-1 h-2 bg-rbx-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rbx-orange to-rbx-red"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs text-rbx-muted">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Review Form */}
        {!userReview && currentUser && (
          <div className="mt-8">
            {!hasPlayedGame && !checkingPlayStatus ? (
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-6">
                <p className="text-sm text-orange-400">
                  ⚠️ You must play this game before you can leave a review. Join the game on Roblox and come back to share your thoughts!
                </p>
              </div>
            ) : checkingPlayStatus ? (
              <div className="rounded-lg bg-rbx-surface-2 px-6 py-3 text-sm text-rbx-muted">
                Checking if you've played this game...
              </div>
            ) : (
              <>
                {!showForm ? (
                  <button
                    onClick={() => setShowForm(true)}
                    className="rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    ✍️ Write a Review
                  </button>
                ) : (
                  <form onSubmit={handleSubmitReview} className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6 space-y-4">
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

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setFormData({ ...formData, rating })}
                            className={`text-3xl transition ${
                              rating <= formData.rating ? 'text-rbx-orange' : 'text-rbx-muted hover:text-white'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Summarize your experience..."
                        className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-4 py-2 text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none"
                        maxLength={200}
                      />
                      <p className="mt-1 text-xs text-rbx-muted">{formData.title.length}/200</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Review</label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Share your thoughts about this game..."
                        className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-4 py-2 text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none"
                        rows={5}
                        maxLength={5000}
                      />
                      <p className="mt-1 text-xs text-rbx-muted">{formData.content.length}/5000</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setError('');
                          setSuccess('');
                        }}
                        className="rounded-lg border border-rbx-border px-6 py-2 text-sm font-bold text-rbx-muted transition hover:text-white"
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
        <div className="mt-8">
          {reviewsData && reviewsData.reviews.length > 0 ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <label className="text-sm font-semibold text-rbx-muted">Sort by:</label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white focus:border-rbx-orange focus:outline-none"
                >
                  <option value="recent">Recent</option>
                  <option value="helpful">Most Helpful</option>
                  <option value="rating_high">Highest Rated</option>
                  <option value="rating_low">Lowest Rated</option>
                </select>
              </div>

              <div className="space-y-4">
                {reviewsData.reviews.map((review) => (
                  <div key={review.id} className="rounded-lg border border-rbx-border bg-rbx-surface p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <span
                                key={i}
                                className={i <= review.rating ? 'text-rbx-orange' : 'text-rbx-muted'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <h3 className="font-bold text-white">{review.title}</h3>
                        </div>
                        <p className="mt-1 text-xs text-rbx-muted">
                          By {review.reviewer?.display_name || 'Anonymous'} • {dateFormatter.format(new Date(review.created_at))}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-rbx-muted">{review.content}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4 pt-4 border-t border-rbx-border/30">
                      <button
                        onClick={() => handleHelpfulVote(review.id, true)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rbx-muted transition hover:text-white hover:bg-rbx-surface-2"
                      >
                        👍 {review.helpful_count}
                      </button>
                      <button
                        onClick={() => handleHelpfulVote(review.id, false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rbx-muted transition hover:text-white hover:bg-rbx-surface-2"
                      >
                        👎 {review.unhelpful_count}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {reviewsData.pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <button
                      onClick={() => setPage(page - 1)}
                      className="rounded-lg border border-rbx-border px-3 py-2 text-sm font-semibold text-rbx-muted transition hover:text-white"
                    >
                      ← Previous
                    </button>
                  )}
                  <div className="flex gap-1">
                    {Array.from({ length: reviewsData.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
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
                      className="rounded-lg border border-rbx-border px-3 py-2 text-sm font-semibold text-rbx-muted transition hover:text-white"
                    >
                      Next →
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-rbx-border bg-rbx-surface p-8 text-center">
              <p className="text-sm text-rbx-muted">No reviews yet. Be the first to review this game!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
