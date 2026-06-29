'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';

type Comment = {
  id: string;
  content: string;
  likes_count: number;
  reply_count: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  parent_id: string | null;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
};

type CommentsResponse = {
  comments: Comment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage: number;
  };
  likedCommentIds: string[];
  sort: string;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'short', timeStyle: 'short' });

export default function CommentsSection({ gameId }: { gameId: string }) {
  const [commentsData, setCommentsData] = useState<CommentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());

  // Get current user
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUser({ id: data.user.id });
      }
    });
  }, []);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      setLoading(true);
      try {
        const url = new URL('/api/comments', window.location.origin);
        url.searchParams.set('gameId', gameId);
        url.searchParams.set('sort', sort);
        url.searchParams.set('page', page.toString());

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load comments');

        const data: CommentsResponse = await response.json();
        setCommentsData(data);
        setLikedCommentIds(new Set(data.likedCommentIds));
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [gameId, sort, page]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please sign in to leave a comment');
      return;
    }

    if (!newComment.trim()) {
      setError('Please enter a comment');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          content: newComment,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit comment');
      }

      setNewComment('');
      setShowForm(false);

      // Reload comments
      const url = new URL('/api/comments', window.location.origin);
      url.searchParams.set('gameId', gameId);
      url.searchParams.set('sort', sort);
      url.searchParams.set('page', page.toString());

      const commentsResponse = await fetch(url);
      const updatedData: CommentsResponse = await commentsResponse.json();
      setCommentsData(updatedData);
      setLikedCommentIds(new Set(updatedData.likedCommentIds));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isCurrentlyLiked: boolean) => {
    if (!currentUser) {
      setError('Please sign in to like comments');
      return;
    }

    try {
      const response = await fetch('/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          isLiking: !isCurrentlyLiked,
        }),
      });

      if (!response.ok) throw new Error('Failed to like comment');

      // Update local state
      const newLikedIds = new Set(likedCommentIds);
      if (isCurrentlyLiked) {
        newLikedIds.delete(commentId);
      } else {
        newLikedIds.add(commentId);
      }
      setLikedCommentIds(newLikedIds);

      // Update comment count in data
      if (commentsData) {
        const updatedComments = commentsData.comments.map((c) =>
          c.id === commentId
            ? { ...c, likes_count: isCurrentlyLiked ? c.likes_count - 1 : c.likes_count + 1 }
            : c
        );
        setCommentsData({ ...commentsData, comments: updatedComments });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like comment');
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  return (
    <div className="mt-12 space-y-8">
      <div className="border-t border-rbx-border pt-8">
        <h2 className="text-2xl font-black text-white">Discussion ({commentsData?.pagination.totalResults || 0})</h2>

        {/* New Comment Form */}
        {currentUser && (
          <div className="mt-8">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                💬 Join the Discussion
              </button>
            ) : (
              <form onSubmit={handleSubmitComment} className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-6 space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this game..."
                    className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-4 py-2 text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none"
                    rows={4}
                    maxLength={5000}
                  />
                  <p className="mt-1 text-xs text-rbx-muted">{newComment.length}/5000</p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError('');
                    }}
                    className="rounded-lg border border-rbx-border px-6 py-2 text-sm font-bold text-rbx-muted transition hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Comments List */}
        <div className="mt-8">
          {loading ? (
            <div className="rounded-lg bg-rbx-surface-2 px-6 py-8 text-center">
              <p className="text-sm text-rbx-muted">Loading comments...</p>
            </div>
          ) : commentsData && commentsData.comments.length > 0 ? (
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
                  <option value="trending">Most Liked</option>
                </select>
              </div>

              <div className="space-y-4">
                {commentsData.comments.map((comment) => {
                  const isLiked = likedCommentIds.has(comment.id);
                  return (
                    <div key={comment.id} className="rounded-lg border border-rbx-border bg-rbx-surface p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{comment.profiles?.display_name || 'Anonymous'}</span>
                            <span className="text-xs text-rbx-muted">
                              {dateFormatter.format(new Date(comment.created_at))}
                              {comment.is_edited && ' (edited)'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-rbx-muted">{comment.content}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4 pt-4 border-t border-rbx-border/30">
                        <button
                          onClick={() => handleLikeComment(comment.id, isLiked)}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            isLiked
                              ? 'text-rbx-orange bg-rbx-surface-2'
                              : 'text-rbx-muted hover:text-white hover:bg-rbx-surface-2'
                          }`}
                        >
                          👍 {comment.likes_count}
                        </button>
                        {comment.reply_count > 0 && (
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rbx-muted transition hover:text-white hover:bg-rbx-surface-2"
                          >
                            💬 {comment.reply_count} {expandedReplies.has(comment.id) ? '▼' : '▶'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {commentsData.pagination.totalPages > 1 && (
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
                    {Array.from({ length: commentsData.pagination.totalPages }, (_, i) => i + 1).map((p) => (
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
                  {page < commentsData.pagination.totalPages && (
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
              <p className="text-sm text-rbx-muted">No comments yet. Be the first to join the discussion!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
