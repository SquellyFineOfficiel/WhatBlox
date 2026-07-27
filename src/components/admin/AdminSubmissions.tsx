import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle2, XCircle, ExternalLink, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Submission {
  id: string;
  universe_id: number;
  roblox_url: string;
  title: string | null;
  developer: string | null;
  genre: string | null;
  submitter_name: string | null;
  submitter_note: string | null;
  status: string;
  created_at: string;
}

const EDGE_FUNCTION_URL =
  import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') +
  '/functions/v1/approve-submission';

export function AdminSubmissions() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('game_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (fetchError) throw fetchError;
      setSubmissions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleAction = useCallback(
    async (submissionId: string, action: 'approve' | 'reject') => {
      setActionLoading(submissionId);
      try {
        const password = prompt(
          action === 'approve'
            ? 'Enter admin password to approve this game:'
            : 'Enter admin password to reject this submission:'
        );
        if (!password) { setActionLoading(null); return; }

        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuf = await crypto.subtle.digest('SHA-256', data);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        const hash = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');

        const res = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hash}` },
          body: JSON.stringify({ submission_id: submissionId, action }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || result.detail || 'Edge function error');

        toast({
          title: action === 'approve' ? 'Game approved!' : 'Submission rejected',
          variant: action === 'approve' ? 'success' : 'default',
        });
        fetchSubmissions();
      } catch (err) {
        toast({
          title: 'Action failed',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'error',
        });
      } finally {
        setActionLoading(null);
      }
    },
    [fetchSubmissions, toast]
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <Button variant="white" onClick={fetchSubmissions}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Submissions Queue</h1>
          <p className="text-sm text-slate-400 mt-1">
            {submissions.length} pending{submissions.length > 0 ? '' : ' — nothing to review'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchSubmissions}>
          Refresh
        </Button>
      </div>

      {submissions.length === 0 && (
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-8 text-center text-slate-500">
            <p>No pending submissions. Check back later!</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {submissions.map(sub => (
          <Card
            key={sub.id}
            className="bg-slate-900/80 border-slate-800 backdrop-blur-sm"
          >
            <CardContent className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-base truncate">
                    {sub.title || 'Unknown Game'}
                  </h3>
                  {sub.developer && (
                    <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <User className="h-3.5 w-3.5" />
                      {sub.developer}
                    </p>
                  )}
                </div>
                <a
                  href={sub.roblox_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Open in Roblox"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Universe ID / Genre badge */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                <Badge variant="outline" className="text-[11px]">
                  ID: {sub.universe_id}
                </Badge>
                {sub.genre && (
                  <Badge variant="outline" className="text-[11px] capitalize">
                    {sub.genre}
                  </Badge>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(sub.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Submitter note */}
              {sub.submitter_note && (
                <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-300 italic border border-slate-700/50">
                  &ldquo;{sub.submitter_note}&rdquo;
                  {sub.submitter_name && (
                    <span className="text-slate-500 not-italic"> &mdash; {sub.submitter_name}</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => handleAction(sub.id, 'approve')}
                  disabled={actionLoading === sub.id}
                  className="flex-1 sm:flex-none"
                >
                  {actionLoading === sub.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleAction(sub.id, 'reject')}
                  disabled={actionLoading === sub.id}
                  className="flex-1 sm:flex-none"
                >
                  {actionLoading === sub.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}