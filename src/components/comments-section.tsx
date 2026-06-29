'use client';

import Link from 'next/link';
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
    <div className="space-y-6">
      <div className="border-b border-rbx-border pb-6">
        <h2 className="text-xl font-black text-white">Discussion</h2>
        <p className="mt-1 text-sm text-rbx-muted">{commentsData?.pagination.totalResults || 0} message{(commentsData?.pagination.totalResults || 0) !== 1 ? 's' : ''}</p>
      </div>

      {/* New Comment Form */}
      {currentUser ? (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              💬 Start a conversation
            </button>
          ) : (
            <form onSubmit={handleSubmitComment} className="rounded-xl border border-rbx-border bg-rbx-surface-2 p-5 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </div>
              )}

              <div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none resize-none"
                  rows={4}
                  maxLength={5000}
                />
                <p className="mt-1 text-xs text-rbx-muted text-right">{newComment.length}/5000</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                  }}
                  className="flex-1 rounded-lg border border-rbx-border px-4 py-2 text-sm font-bold text-rbx-muted transition hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6 text-center">
          <p className="text-sm text-rbx-muted mb-4">Sign in to join the discussion</p>
          <Link href="/auth" className="inline-block rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-6 py-2 text-sm font-bold text-white transition hover:opacity-90">
            Sign In →
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div>
        {loading ? (
          <div className="rounded-lg bg-rbx-surface-2 px-6 py-8 text-center">
            <p className="text-xs text-rbx-muted">Loading...</p>
          </div>
        ) : commentsData && commentsData.comments.length > 0 ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <label className="text-xs font-semibold text-rbx-muted">Sort:</label>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-rbx-border bg-rbx-surface px-3 py-1.5 text-xs text-white focus:border-rbx-orange focus:outline-none"
              >
                <option value="recent">Recent</option>
                <option value="trending">Most Liked</option>
              </select>
            </div>

            <div className="space-y-3">
              {commentsData.comments.map((comment) => {
                const isLiked = likedCommentIds.has(comment.id);
                return (
                  <div key={comment.id} className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white text-sm truncate">{comment.profiles?.display_name || 'Anonymous'}</span>
                          <span className="text-xs text-rbx-muted shrink-0">
                            {dateFormatter.format(new Date(comment.created_at))}
                            {comment.is_edited && ' (edited)'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-rbx-muted leading-relaxed break-words">{comment.content}</p>

                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-rbx-border/30">
                      <button
                        onClick={() => handleLikeComment(comment.id, isLiked)}
                        className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition ${
                          isLiked
                            ? 'text-rbx-orange bg-rbx-surface/50'
                            : 'text-rbx-muted hover:text-white hover:bg-rbx-surface/50'
                        }`}
                      >
                        👍 {comment.likes_count}
                      </button>
                      {comment.reply_count > 0 && (
                        <button
                          onClick={() => toggleReplies(comment.id)}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-rbx-muted transition hover:text-white hover:bg-rbx-surface/50"
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
                  {Array.from({ length: Math.min(commentsData.pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
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
                {page < commentsData.pagination.totalPages && (
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
            <p className="text-sm text-rbx-muted">No comments yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}
