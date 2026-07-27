import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import {
  Shuffle,
  Play,
  Info,
  Users,
} from 'lucide-react';
import { useRobloxGames } from './hooks/useRobloxGames';
import { getIcon, getGradient } from './lib/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AdminPage } from '@/components/admin/AdminPage';
import { SkeletonPage } from '@/components/ui/skeleton';
import { MaintenancePage } from '@/components/landing/MaintenancePage';
import { useMaintenance } from '@/hooks/useMaintenance';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatPlayers(n: number): string {
  return n.toLocaleString('en-US');
}

interface Particle {
  id: string;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  duration: number;
}

function generateParticles(seed: number, count = 16): Particle[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${seed}-${i}`,
    angle: (360 / count) * i + (Math.random() * 24 - 12),
    distance: 80 + Math.random() * 70,
    size: 3 + Math.random() * 4,
    delay: Math.random() * 60,
    duration: 500 + Math.random() * 220,
  }));
}

interface ShuffleState {
  currentId: string;
  queue: string[];
  discovered: Set<string>;
}

function initShuffleState(gameIds: string[]): ShuffleState {
  const shuffled = shuffleArray(gameIds);
  return {
    currentId: shuffled[0],
    queue: shuffled.slice(1),
    discovered: new Set([shuffled[0]]),
  };
}

function HomePage() {
  const { games, loading, error, refetch } = useRobloxGames({
    limit: 50,
    sortBy: 'Visits',
    sortOrder: 'Desc',
  });
  const [state, setState] = useState<ShuffleState | null>(null);
  const [phase, setPhase] = useState<'idle' | 'closing' | 'opening'>('idle');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [burstId, setBurstId] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setShowIntro(false), 340);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (games.length > 0 && !state) {
      const ids = games.map((g) => g.id);
      setState(initShuffleState(ids));
    }
  }, [games, state]);

  const CLOSE_MS = 260;
  const OPEN_MS = 560;

  const handleShuffle = useCallback(() => {
    if (phase !== 'idle' || !state) return;
    setPhase('closing');

    window.setTimeout(() => {
      setState((prev) => {
        if (!prev) return prev;
        let queue = prev.queue;
        let discovered = prev.discovered;

        if (queue.length === 0) {
          const ids = games.map((g) => g.id).filter((id) => id !== prev.currentId);
          queue = shuffleArray(ids);
          queue.push(prev.currentId);
          discovered = new Set();
        }

        const [next, ...rest] = queue;
        const nextDiscovered = new Set(discovered);
        nextDiscovered.add(next);

        return { currentId: next, queue: rest, discovered: nextDiscovered };
      });

      setBurstId((id) => id + 1);
      setParticles(generateParticles(Date.now()));
      setPhase('opening');

      window.setTimeout(() => {
        setPhase('idle');
        setParticles([]);
      }, OPEN_MS);
    }, CLOSE_MS);
  }, [phase, state, games]);

  if (loading) {
    return <SkeletonPage />;
  }

  if (error) {
    return (
      <div className="wb-page">
        <div className="wb-grain" aria-hidden="true" />
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">Failed to load games: {error}</p>
              <Button variant="white" onClick={refetch} className="w-full">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!state || games.length === 0) {
    return (
      <div className="wb-page">
        <div className="wb-grain" aria-hidden="true" />
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No games found in database.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentGame = games.find((g) => g.id === state.currentId) || games[0];
  const CurrentIcon = getIcon(currentGame.icon_name);
  const gradient = getGradient(currentGame.gradient_from, currentGame.gradient_to);

  return (
    <div className="wb-page">
      <div className="wb-grain" aria-hidden="true" />

      <header className="wb-header">
        <div className="wb-brand">
          <div className="wb-logo-slot" aria-label="Logo placeholder" />
          <span className="wb-wordmark">WhatBlox</span>
        </div>
        <nav className="wb-nav">
          <div className="wb-nav-links">
            <Button variant="ghost" className="wb-pill wb-pill--ghost" type="button">
              Explore
            </Button>
            <Button variant="ghost" className="wb-pill wb-pill--ghost" type="button">
              For developers
            </Button>
          </div>
          <Button variant="white" className="wb-pill wb-pill--solid" type="button">
            Submit a game
          </Button>
        </nav>
      </header>

      <main className="wb-main">
        <section className="wb-hero">
          <h1 className="wb-headline">
            The algorithm has bad taste.
            <br />
            We don&rsquo;t.
          </h1>
          <p className="wb-subhead">
            WhatBlox is a shuffle-powered shelf of real, human-made Roblox
            games &mdash; no pay-to-rank placements, no bot-farmed brainrot, no AI
            slop. One game at a time. Hit shuffle when you&rsquo;re ready for
            the next one.
          </p>
        </section>

        <section className="wb-card-wrap">
          <article
            className={`wb-card ${showIntro ? 'wb-card--intro' : ''} ${
              phase === 'closing' ? 'wb-card--closing' : ''
            } ${phase === 'opening' ? 'wb-card--opening' : ''}`}
          >
            <div
              className="wb-banner relative"
              style={{
                background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
              }}
            >
              <div className="wb-banner-texture" />
              <div className="wb-flash" aria-hidden="true" />
              <div className="wb-shine" aria-hidden="true" />

              {phase === 'opening' && (
                <div className="wb-particles" key={burstId} aria-hidden="true">
                  {particles.map((p) => {
                    const rad = (p.angle * Math.PI) / 180;
                    const tx = Math.cos(rad) * p.distance;
                    const ty = Math.sin(rad) * p.distance;
                    return (
                      <span
                        key={p.id}
                        className="wb-particle"
                        style={{
                          width: p.size,
                          height: p.size,
                          animationDelay: `${p.delay}ms`,
                          animationDuration: `${p.duration}ms`,
                          '--tx': `${tx}px`,
                          '--ty': `${ty}px`,
                        } as CSSProperties}
                      />
                    );
                  })}
                </div>
              )}

              <CurrentIcon className="wb-banner-icon" strokeWidth={1.25} />

              <Badge className="wb-badge wb-badge--genre">
                {currentGame.genre}
              </Badge>
              <Badge className="wb-badge wb-badge--live" variant="secondary">
                <span className="wb-live-dot" />
                {formatPlayers(currentGame.players_now)} playing now
              </Badge>
            </div>

            <div className="wb-card-body">
              <div className="wb-card-heading">
                <div>
                  <h2 className="wb-game-title">{currentGame.title}</h2>
                  <span className="wb-developer">by {currentGame.developer}</span>
                </div>
                <div className="wb-visits">
                  <Users size={15} strokeWidth={2} />
                  <span>{currentGame.total_visits.toLocaleString()} visits</span>
                </div>
              </div>

              <ScrollArea className="wb-description">
                {currentGame.description}
              </ScrollArea>

              <div className="wb-cta-row">
                <Button className="wb-btn wb-btn--primary" type="button">
                  <Play size={16} strokeWidth={2.25} fill="currentColor" />
                  Play
                </Button>
                <Button variant="ghost" className="wb-btn wb-btn--ghost" type="button">
                  <Info size={16} strokeWidth={2.25} />
                  Learn more
                </Button>
              </div>
            </div>
          </article>

          <div className="wb-shuffle-row">
            <div className="wb-shuffle-btn-wrap">
              <Button
                className={`wb-shuffle-btn ${phase !== 'idle' ? 'is-active' : ''}`}
                type="button"
                onClick={handleShuffle}
                aria-label="Shuffle to a new game"
                variant="white"
                size="icon-lg"
              >
                <Shuffle size={22} strokeWidth={2.25} />
              </Button>
              <span className="wb-shuffle-ring" aria-hidden="true" />
            </div>
            <div className="wb-shuffle-meta">
              <span className="wb-shuffle-label">Shuffle</span>
              <div className="wb-dots">
                {games.map((g) => (
                  <span
                    key={g.id}
                    className={`wb-dot ${
                      state.discovered.has(g.id) ? 'wb-dot--filled' : ''
                    } ${g.id === currentGame.id ? 'wb-dot--current' : ''}`}
                  />
                ))}
              </div>
              <span className="wb-shuffle-count">
                {state.discovered.size} of {games.length} discovered
              </span>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap');

        :root {
          --wb-bg: #161617;
          --wb-panel: #1E1E21;
          --wb-panel-raised: #27272B;
          --wb-line: rgba(255, 255, 255, 0.07);
          --wb-line-strong: rgba(255, 255, 255, 0.13);
          --wb-ink: #F5F5F3;
          --wb-ink-soft: #9FA0A3;
          --wb-ink-faint: #737377;
          --wb-white-pill: #F5F5F3;
          --wb-white-pill-ink: #0A0A0B;
          --wb-accent: #6D6AF7;
          --wb-green: #4ADE80;
        }

        .wb-page {
          position: relative;
          min-height: 100vh;
          background:
            radial-gradient(ellipse 900px 500px at 85% -5%, rgba(255,255,255,0.05), transparent 60%),
            radial-gradient(ellipse 700px 500px at 8% 30%, rgba(255,255,255,0.035), transparent 60%),
            var(--wb-bg);
          color: var(--wb-ink);
          font-family: 'General Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
        }

        .wb-grain {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.35;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
          background-size: 180px 180px;
        }

        .wb-page > * {
          position: relative;
          z-index: 1;
        }

        .wb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: clamp(14px, 3vw, 20px) clamp(16px, 5vw, 64px);
          border-bottom: 1px solid var(--wb-line);
          transition: padding 0.3s ease;
        }

        .wb-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .wb-logo-slot {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          border: 1.5px dashed var(--wb-line-strong);
          background: repeating-linear-gradient(
            45deg,
            rgba(255,255,255,0.05),
            rgba(255,255,255,0.05) 4px,
            transparent 4px,
            transparent 8px
          );
          flex-shrink: 0;
          transition: width 0.3s ease, height 0.3s ease;
        }

        .wb-wordmark {
          font-family: 'General Sans', sans-serif;
          font-weight: 600;
          font-size: 22px;
          letter-spacing: -0.01em;
          color: var(--wb-ink);
          transition: font-size 0.3s ease;
        }

        .wb-nav {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .wb-nav-links {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 400px;
          opacity: 1;
          overflow: hidden;
          transition: max-width 0.35s ease, opacity 0.25s ease, gap 0.35s ease;
        }

        .wb-pill {
          border: 1px solid transparent;
          border-radius: 999px;
          padding: 10px 18px;
          font-family: 'General Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease,
            padding 0.3s ease, font-size 0.3s ease;
        }

        .wb-pill:hover { transform: translateY(-1px); }

        .wb-pill--ghost {
          background: transparent;
          border-color: var(--wb-line-strong);
          color: var(--wb-ink);
        }
        .wb-pill--ghost:hover { background: rgba(255, 255, 255, 0.06); }

        .wb-pill--solid {
          background: var(--wb-white-pill);
          color: var(--wb-white-pill-ink);
          font-weight: 600;
        }
        .wb-pill--solid:hover { opacity: 0.88; }

        .wb-main {
          max-width: 900px;
          margin: 0 auto;
          padding: clamp(32px, 8vw, 80px) clamp(16px, 4vw, 20px) 100px;
          display: flex;
          flex-direction: column;
          gap: clamp(28px, 6vw, 48px);
          transition: padding 0.3s ease, gap 0.3s ease;
        }

        .wb-hero {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .wb-headline {
          font-family: 'General Sans', sans-serif;
          font-weight: 600;
          font-size: clamp(28px, 8vw, 58px);
          line-height: 1.06;
          letter-spacing: -0.02em;
          margin: 0;
          color: var(--wb-ink);
          transition: font-size 0.3s ease;
        }

        .wb-subhead {
          max-width: 560px;
          font-size: clamp(14.5px, 3.4vw, 16.5px);
          line-height: 1.6;
          color: var(--wb-ink-soft);
          margin: 0;
          transition: font-size 0.3s ease;
        }

        .wb-card-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
        }

        .wb-card {
          width: 100%;
          background: var(--wb-panel);
          border: 1px solid var(--wb-line);
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 24px 60px -30px rgba(0, 0, 0, 0.8);
          transform-style: preserve-3d;
        }

        .wb-card--intro {
          animation: wb-card-in 0.32s ease both;
        }

        @keyframes wb-card-in {
          from { opacity: 0; transform: scale(0.98) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .wb-card--closing {
          animation: wb-pack-close 0.26s cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        @keyframes wb-pack-close {
          0% {
            transform: perspective(1000px) rotateY(0deg) scale(1);
            filter: brightness(1);
          }
          100% {
            transform: perspective(1000px) rotateY(-95deg) scale(0.9);
            filter: brightness(0.4);
            opacity: 0.35;
          }
        }

        .wb-card--opening {
          animation: wb-pack-open 0.56s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes wb-pack-open {
          0% {
            transform: perspective(1000px) rotateY(95deg) scale(0.9);
            filter: brightness(2.2);
            opacity: 0;
          }
          45% {
            opacity: 1;
            filter: brightness(1.3);
          }
          70% {
            transform: perspective(1000px) rotateY(-7deg) scale(1.035);
            filter: brightness(1.05);
          }
          100% {
            transform: perspective(1000px) rotateY(0deg) scale(1);
            filter: brightness(1);
            opacity: 1;
          }
        }

        .wb-banner {
          position: relative;
          height: clamp(180px, 30vw, 240px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: height 0.3s ease;
        }

        .wb-banner-texture {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px);
          background-size: 18px 18px;
          opacity: 0.6;
        }

        .wb-banner-icon {
          width: clamp(72px, 14vw, 108px);
          height: clamp(72px, 14vw, 108px);
          color: rgba(255, 255, 255, 0.28);
          position: relative;
          z-index: 1;
          transition: width 0.3s ease, height 0.3s ease;
        }

        .wb-flash {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          background: radial-gradient(circle at 50% 45%, rgba(255,255,255,0.85), rgba(255,255,255,0) 60%);
          z-index: 2;
        }

        .wb-card--opening .wb-flash {
          animation: wb-flash-pop 0.55s ease-out;
        }

        @keyframes wb-flash-pop {
          0% { opacity: 0; transform: scale(0.6); }
          28% { opacity: 0.9; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.5); }
        }

        .wb-shine {
          position: absolute;
          top: 0;
          left: -160%;
          width: 55%;
          height: 100%;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-20deg);
          pointer-events: none;
          z-index: 2;
        }

        .wb-card--opening .wb-shine {
          animation: wb-shine-sweep 0.6s ease-out;
        }

        @keyframes wb-shine-sweep {
          0% { left: -160%; opacity: 0; }
          12% { opacity: 1; }
          55% { opacity: 1; }
          100% { left: 160%; opacity: 0; }
        }

        .wb-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 3;
        }

        .wb-particle {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.6);
          opacity: 0;
          animation-name: wb-particle-burst;
          animation-timing-function: cubic-bezier(0.2, 0.8, 0.3, 1);
          animation-fill-mode: forwards;
        }

        @keyframes wb-particle-burst {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0);
            opacity: 1;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(1);
            opacity: 0;
          }
        }

        .wb-badge {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: clamp(11px, 2.4vw, 12.5px);
          font-weight: 600;
          padding: clamp(6px, 1.4vw, 7px) clamp(9px, 2vw, 12px);
          border-radius: 999px;
          z-index: 2;
          transition: font-size 0.3s ease, padding 0.3s ease;
        }

        .wb-badge--genre {
          top: 16px;
          left: 16px;
          background: var(--wb-white-pill);
          color: var(--wb-white-pill-ink);
        }

        .wb-badge--live {
          top: 16px;
          right: 16px;
          background: rgba(12, 12, 13, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--wb-ink);
          backdrop-filter: blur(6px);
          font-size: 12px;
        }

        .wb-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--wb-green);
          box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.2);
        }

        .wb-card-body {
          padding: clamp(18px, 4vw, 26px) clamp(16px, 4.5vw, 28px) clamp(20px, 4.5vw, 28px);
          display: flex;
          flex-direction: column;
          gap: clamp(14px, 3vw, 18px);
          transition: padding 0.3s ease, gap 0.3s ease;
        }

        .wb-card-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          transition: flex-direction 0.2s ease;
        }

        .wb-game-title {
          font-family: 'General Sans', sans-serif;
          font-weight: 600;
          font-size: clamp(21px, 4.5vw, 27px);
          margin: 0 0 4px;
          letter-spacing: -0.01em;
          color: var(--wb-ink);
          transition: font-size 0.3s ease;
        }

        .wb-developer {
          font-size: 13px;
          color: var(--wb-ink-faint);
        }

        .wb-visits {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--wb-ink-soft);
          border: 1px solid var(--wb-line);
          border-radius: 999px;
          padding: 6px 12px;
          white-space: nowrap;
        }

        .wb-description {
          white-space: pre-wrap;
          font-size: clamp(13.5px, 2.6vw, 14px);
          line-height: 1.65;
          color: var(--wb-ink-soft);
          max-height: clamp(220px, 34vw, 260px);
          overflow-y: auto;
          padding: clamp(14px, 3vw, 16px) clamp(15px, 3.4vw, 18px);
          background: var(--wb-panel-raised);
          border: 1px solid var(--wb-line);
          border-radius: 14px;
          transition: font-size 0.3s ease, max-height 0.3s ease, padding 0.3s ease;
        }

        .wb-description::-webkit-scrollbar {
          width: 8px;
        }
        .wb-description::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.14);
          border-radius: 999px;
        }
        .wb-description::-webkit-scrollbar-track {
          background: transparent;
        }

        .wb-cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .wb-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          padding: 12px 20px;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
          font-family: 'General Sans', sans-serif;
        }

        .wb-btn:hover { transform: translateY(-1px); }

        .wb-btn--primary {
          background: var(--wb-white-pill);
          color: var(--wb-white-pill-ink);
        }
        .wb-btn--primary:hover { opacity: 0.88; }

        .wb-btn--ghost {
          background: transparent;
          border-color: var(--wb-line-strong);
          color: var(--wb-ink);
        }
        .wb-btn--ghost:hover { background: rgba(255, 255, 255, 0.06); }

        .wb-shuffle-row {
          display: flex;
          align-items: center;
          gap: 16px;
          transition: gap 0.3s ease;
        }

        .wb-shuffle-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          background: var(--wb-white-pill);
          color: var(--wb-white-pill-ink);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 10px 24px -12px rgba(0, 0, 0, 0.7);
          transition: transform 0.15s ease;
        }

        .wb-shuffle-btn:hover { transform: scale(1.06); }
        .wb-shuffle-btn:active { transform: scale(0.96); }

        .wb-shuffle-btn.is-active svg {
          animation: wb-spin-fast 0.55s cubic-bezier(0.3, 0.6, 0.3, 1);
        }

        @keyframes wb-spin-fast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .wb-shuffle-btn-wrap {
          position: relative;
          display: inline-flex;
        }

        .wb-shuffle-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid var(--wb-white-pill);
          opacity: 0;
          pointer-events: none;
        }

        .wb-shuffle-btn.is-active + .wb-shuffle-ring {
          animation: wb-ring-pop 0.55s ease-out;
        }

        @keyframes wb-ring-pop {
          0% { opacity: 0.85; transform: scale(0.75); }
          100% { opacity: 0; transform: scale(1.7); }
        }

        .wb-shuffle-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .wb-shuffle-label {
          font-family: 'General Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: var(--wb-ink);
        }

        .wb-dots {
          display: flex;
          gap: 6px;
        }

        .wb-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--wb-line-strong);
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .wb-dot--filled {
          background: var(--wb-ink-soft);
        }

        .wb-dot--current {
          background: var(--wb-accent);
          transform: scale(1.3);
        }

        .wb-shuffle-count {
          font-size: 11.5px;
          color: var(--wb-ink-faint);
        }

        @media (max-width: 640px) {
          .wb-nav-links {
            max-width: 0;
            opacity: 0;
            gap: 0;
            pointer-events: none;
          }

          .wb-cta-row .wb-btn { flex: 1 1 auto; justify-content: center; }

          .wb-shuffle-row {
            width: 100%;
            flex-direction: column;
            text-align: center;
          }
          .wb-shuffle-meta { align-items: center; }
          .wb-dots { justify-content: center; }
        }

        @media (max-width: 400px) {
          .wb-card-heading { flex-direction: column; align-items: flex-start; }
          .wb-visits { align-self: flex-start; }
          .wb-cta-row { flex-direction: column; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wb-card--intro,
          .wb-card--closing,
          .wb-card--opening,
          .wb-particle,
          .wb-flash,
          .wb-shine,
          .wb-shuffle-btn.is-active svg,
          .wb-shuffle-btn.is-active + .wb-shuffle-ring {
            animation: none !important;
          }

          .wb-header,
          .wb-logo-slot,
          .wb-wordmark,
          .wb-nav-links,
          .wb-pill,
          .wb-main,
          .wb-headline,
          .wb-subhead,
          .wb-banner,
          .wb-banner-icon,
          .wb-badge,
          .wb-card-body,
          .wb-card-heading,
          .wb-game-title,
          .wb-description,
          .wb-shuffle-row {
            transition: none !important;
          }
        }

        .wb-page[data-loading="true"] .wb-main,
        .wb-page[data-loading="true"] .wb-header,
        .wb-page[data-loading="true"] .wb-hero,
        .wb-page[data-loading="true"] .wb-card-wrap {
          opacity: 0;
          pointer-events: none;
        }

        .wb-page:not([data-loading="true"]) .wb-skeleton-page {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { isMaintenance, loading: maintenanceLoading } = useMaintenance();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash === 'admin') {
      setIsAdmin(true);
    }
  }, []);

  const handleHashChange = () => {
    const hash = window.location.hash.slice(1);
    setIsAdmin(hash === 'admin');
  };

  useEffect(() => {
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (maintenanceLoading) {
    return <SkeletonPage />;
  }

  if (isMaintenance && !isAdmin) {
    return <MaintenancePage />;
  }

  if (isAdmin) {
    return <AdminPage />;
  }

  return <HomePage />;
}