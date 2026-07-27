import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { getIcon } from '@/lib/icons';
import { useToast } from '@/hooks/useToast';
import { Loader2, Globe, ExternalLink, Send, History } from 'lucide-react';

const SUBMISSION_IDS_KEY = 'whatblox_my_submissions';

interface GamePreview {
  universeId: number;
  name: string;
  description: string;
  creator?: { name: string };
  rootPlace?: { id: number };
  playing?: number;
  visits?: number;
}

export function SubmitGameDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();

  const [step, setStep] = useState<'url' | 'preview' | 'form' | 'done'>('url');
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [preview, setPreview] = useState<GamePreview | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitterName, setSubmitterName] = useState('');
  const [submitterNote, setSubmitterNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showTrack, setShowTrack] = useState(false);

  // Track-my-submissions state
  const mySubmissionIds = useRef<string[]>(
    (() => {
      try {
        return JSON.parse(localStorage.getItem(SUBMISSION_IDS_KEY) || '[]');
      } catch {
        return [];
      }
    })()
  );
  const [mySubmissions, setMySubmissions] = useState<Array<{ id: string; title: string | null; status: string; created_at: string }>>([]);
  const [fetchingTracked, setFetchingTracked] = useState(false);

  const reset = useCallback(() => {
    setStep('url');
    setUrl('');
    setPreview(null);
    setFetchError(null);
    setSubmitterName('');
    setSubmitterNote('');
    setSubmitting(false);
    setShowTrack(false);
  }, []);

  const handleClose = useCallback(
    (v: boolean) => {
      if (!v) { reset(); onOpenChange(false); }
    },
    [reset, onOpenChange]
  );

  // Validate Roblox URL / universe ID and fetch preview.
  const handleFetch = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Extract universe id from Roblox URL or treat as raw id.
    let universeId: string;
    const match = trimmed.match(
      /roblox\.com\/games\/(\d+)/i
    );
    if (match) {
      universeId = match[1];
    } else if (/^\d+$/.test(trimmed)) {
      universeId = trimmed;
    } else {
      setFetchError('Enter a Roblox game URL (e.g. https://www.roblox.com/games/12345) or a numeric universe ID.');
      return;
    }

    setFetching(true);
    setFetchError(null);
    setPreview(null);

    try {
      const res = await fetch(
        `https://games.roproxy.com/v1/games?universeIds=${encodeURIComponent(universeId)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error(`Roblox API error: ${res.status}`);
      const data = await res.json();
      const game: GamePreview | undefined = data?.data?.[0];
      if (!game) {
        setFetchError('Game not found. Make sure the universe ID or URL is correct.');
        return;
      }
      setPreview(game);
      setStep('preview');
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch game data.');
    } finally {
      setFetching(false);
    }
  }, [url]);

  // Submit to Supabase.
  const handleSubmit = useCallback(async () => {
    if (!preview) return;
    setSubmitting(true);
    try {
      const robloxUrl = `https://www.roblox.com/games/${preview.rootPlace?.id || preview.universeId}`;
      const { data, error } = await supabase.from('game_submissions').insert({
        universe_id: preview.universeId,
        roblox_url: robloxUrl,
        title: preview.name,
        developer: preview.creator?.name || null,
        submitter_name: submitterName.trim() || null,
        submitter_note: submitterNote.trim() || null,
      }).select('id').single();

      if (error) throw error;

      // Track submission id in localStorage.
      mySubmissionIds.current.push(data.id);
      localStorage.setItem(SUBMISSION_IDS_KEY, JSON.stringify(mySubmissionIds.current));

      toast({ title: 'Submitted!', description: 'We&rsquo;ll review your game shortly.', variant: 'success' });
      setStep('done');
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }, [preview, submitterName, submitterNote, toast]);

  // Tracked submissions fetch.
  const fetchTracked = useCallback(async () => {
    if (mySubmissionIds.current.length === 0) return;
    setFetchingTracked(true);
    try {
      const { data, error } = await supabase
        .from('game_submissions')
        .select('id, title, status, created_at')
        .in('id', mySubmissionIds.current)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMySubmissions(data || []);
      setShowTrack(true);
    } catch {
      toast({ title: 'Failed to load submissions', variant: 'error' });
    } finally {
      setFetchingTracked(false);
    }
  }, [toast]);

  const Icon = preview ? getIcon('gamepad2') : Globe;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit a Game</DialogTitle>
          <DialogDescription>
            Share a Roblox game you love with the WhatBlox community.
          </DialogDescription>
        </DialogHeader>

        {/* Step URL */}
        {step === 'url' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="game-url">Roblox game URL or Universe ID</Label>
              <div className="flex gap-2">
                <Input
                  id="game-url"
                  placeholder="https://www.roblox.com/games/123456789/..."
                  value={url}
                  onChange={e => { setUrl(e.target.value); setFetchError(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleFetch(); }}
                />
                <Button onClick={handleFetch} disabled={fetching || !url.trim()}>
                  {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
                </Button>
              </div>
              {fetchError && (
                <p className="text-sm text-red-400 mt-1">{fetchError}</p>
              )}
            </div>

            {/* Track my submissions */}
            {mySubmissionIds.current.length > 0 && (
              <div className="pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchTracked}
                  disabled={fetchingTracked}
                >
                  {fetchingTracked ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <History className="h-4 w-4 mr-2" />
                  )}
                  Track my submissions ({mySubmissionIds.current.length})
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step preview */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
              <Icon className="h-10 w-10 text-accent" strokeWidth={1.25} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{preview.name}</div>
                <div className="text-xs text-muted-foreground">
                  {preview.creator?.name || 'Unknown developer'}
                </div>
              </div>
              <a
                href={`https://www.roblox.com/games/${preview.rootPlace?.id || preview.universeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Open in Roblox"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-name">Your name (optional)</Label>
              <Input
                id="sub-name"
                placeholder="How should we credit you?"
                value={submitterName}
                onChange={e => setSubmitterName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-note">Why is this game great? (optional, max 280)</Label>
              <textarea
                id="sub-note"
                className="w-full min-h-[80px] resize-none bg-background border border-input rounded-lg px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Tell us what makes it special..."
                maxLength={280}
                value={submitterNote}
                onChange={e => setSubmitterNote(e.target.value)}
              />
              <div className="flex justify-end">
                <span className="text-[11px] text-muted-foreground">
                  {submitterNote.length}/280
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('url')}>
                Back
              </Button>
              <Button
                variant="white"
                onClick={handleSubmit}
                disabled={submitting}
                className="ml-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step done */}
        {step === 'done' && (
          <div className="text-center py-6 space-y-3">
            <Badge variant="success" className="text-sm px-4 py-1.5">
              Submitted
            </Badge>
            <p className="text-muted-foreground text-sm">
              Thanks! We&rsquo;ll review your game and get it in front of the
              shuffle if it fits.
            </p>
            <Button variant="white" onClick={() => { reset(); onOpenChange(false); }}>
              Done
            </Button>
          </div>
        )}

        {/* Track my submissions panel */}
        {showTrack && (
          <div className="border-t border-border pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">My Submissions</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowTrack(false)}>
                Close
              </Button>
            </div>
            {mySubmissions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No submissions found.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mySubmissions.map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-accent/5 text-xs"
                  >
                    <span className="truncate mr-2">
                      {sub.title || sub.id.slice(0, 8)}
                    </span>
                    <Badge
                      variant={
                        sub.status === 'approved'
                          ? 'success'
                          : sub.status === 'rejected'
                          ? 'destructive'
                          : 'outline'
                      }
                      className="flex-shrink-0 capitalize"
                    >
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}