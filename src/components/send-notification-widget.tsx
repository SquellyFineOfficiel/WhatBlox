'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';

type Game = {
  id: string;
  title: string;
  description: string;
};

export default function SendNotificationWidget() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const loadUserGames = async () => {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUser({ id: user.id });

      try {
        const { data, error: err } = await supabase
          .from('games')
          .select('id,title,description')
          .eq('user_id', user.id)
          .eq('status', 'approved');

        if (err) throw err;
        setGames(data || []);
        if (data && data.length > 0) {
          setSelectedGameId(data[0].id);
        }
      } catch (err) {
        console.error('Error loading games:', err);
        setError('Failed to load your games');
      } finally {
        setLoading(false);
      }
    };

    loadUserGames();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGameId || !title.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: selectedGameId,
          title: title.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      setSuccess(data.message || 'Notification sent successfully!');
      setTitle('');
      setMessage('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6 text-center">
        <p className="text-sm text-rbx-muted">Sign in to send notifications to your followers</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6 text-center">
        <p className="text-sm text-rbx-muted">Loading your games...</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6 text-center">
        <p className="text-sm text-rbx-muted">You haven't created any games yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-rbx-border bg-rbx-surface-2 p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Send Update to Followers</h3>
        <p className="text-xs text-rbx-muted">Notify all players following your game about new updates</p>
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

      <form onSubmit={handleSendNotification} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Select Game</label>
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white focus:border-rbx-orange focus:outline-none"
          >
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Notification Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., New Update Available"
            maxLength={100}
            className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none"
          />
          <p className="mt-1 text-xs text-rbx-muted text-right">{title.length}/100</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the update or news for your followers..."
            maxLength={500}
            rows={4}
            className="w-full rounded-lg border border-rbx-border bg-rbx-surface px-3 py-2 text-sm text-white placeholder:text-rbx-muted focus:border-rbx-orange focus:outline-none resize-none"
          />
          <p className="mt-1 text-xs text-rbx-muted text-right">{message.length}/500</p>
        </div>

        <div className="rounded-lg border border-rbx-border/50 bg-rbx-surface/50 p-3">
          <p className="text-xs text-rbx-muted">
            📢 <span className="font-semibold">Rate limit:</span> Max 5 notifications per 24 hours per game
          </p>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-lg bg-gradient-to-r from-rbx-red to-rbx-orange px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {sending ? 'Sending...' : '📢 Send Notification'}
        </button>
      </form>
    </div>
  );
}
