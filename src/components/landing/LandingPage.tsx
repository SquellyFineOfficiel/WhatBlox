import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play,
  Users,
  Star,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  Gamepad2,
  Globe,
  Sparkle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonPage } from '@/components/ui/skeleton';
import { useGames, RobloxGame } from '@/hooks/useGames';
import { getIcon, getGradient } from '@/lib/icons';
import { MaintenancePage } from '@/components/landing/MaintenancePage';

export interface LandingContent {
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    ctaPrimary: { text: string; href: string };
    ctaSecondary: { text: string; href: string };
  };
  stats: Array<{ icon: React.ElementType; value: string; label: string }>;
  features: Array<{
    icon: React.ElementType;
    title: string;
    description: string;
    gradient: [string, string];
    iconName: string;
  }>;
  howItWorks: Array<{
    step: number;
    title: string;
    description: string;
    icon: React.ElementType;
  }>;
  showcase: {
    title: string;
    subtitle: string;
  };
  cta: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonHref: string;
  };
  footer: {
    brand: string;
    tagline: string;
    links: Array<{ label: string; href: string }>;
    social: Array<{ icon: React.ElementType; href: string; label: string }>;
    copyright: string;
  };
}

export const defaultLandingContent: LandingContent = {
  hero: {
    badge: 'Discover Real Roblox Games',
    headline: 'The algorithm has bad taste.<br />We don\'t.',
    subheadline: 'WhatBlox is a shuffle-powered shelf of real, human-made Roblox games — no pay-to-rank placements, no bot-farmed brainrot, no AI slop. One game at a time. Hit shuffle when you\'re ready for the next one.',
    ctaPrimary: { text: 'Start Shuffling', href: 'https://app.whatblox.com' },
    ctaSecondary: { text: 'How It Works', href: '#how-it-works' },
  },
  stats: [
    { icon: Gamepad2, value: '10,000+', label: 'Games Curated' },
    { icon: Users, value: '500K+', label: 'Active Players' },
    { icon: Star, value: '4.8★', label: 'Avg. Rating' },
    { icon: Zap, value: '99.9%', label: 'Uptime' },
  ],
  features: [
    {
      icon: Gamepad2,
      title: 'Human-Curated Only',
      description: 'Every game is hand-picked by real players. No algorithms pushing paid placements or bot-farmed titles.',
      gradient: ['#6D6AF7', '#9B59B6'],
      iconName: 'gamepad2',
    },
    {
      icon: Shield,
      title: 'Zero Bot Farms',
      description: 'Strict verification ensures authentic player counts and genuine reviews. What you see is what you get.',
      gradient: ['#4ADE80', '#22C55E'],
      iconName: 'shield',
    },
    {
      icon: Sparkles,
      title: 'Shuffle Discovery',
      description: 'One tap, one fresh game. No endless scrolling, no decision fatigue. Pure serendipity.',
      gradient: ['#F59E0B', '#F97316'],
      iconName: 'sparkles',
    },
    {
      icon: Globe,
      title: 'Global Community',
      description: 'Connect with players worldwide. Share discoveries, leave reviews, build your collection.',
      gradient: ['#EC4899', '#8B5CF6'],
      iconName: 'globe',
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: 'Hit Shuffle',
      description: 'Tap the shuffle button and watch the card flip — a new hand-picked game appears instantly.',
      icon: Sparkle,
    },
    {
      step: 2,
      title: 'Explore',
      description: 'Read the description, check live player count, see total visits. Decide if it\'s your vibe.',
      icon: Gamepad2,
    },
    {
      step: 3,
      title: 'Play Instantly',
      description: 'Click "Play" and launch directly into Roblox. No redirects, no friction, no nonsense.',
      icon: ArrowRight,
    },
    {
      step: 4,
      title: 'Track & Share',
      description: 'Mark favorites, see your discovery progress, share gems with friends. Build your collection.',
      icon: Check,
    },
  ],
  showcase: {
    title: 'Games You Might Discover',
    subtitle: 'A rotating selection from our curated library. Every game is verified, human-played, and worth your time.',
  },
  cta: {
    title: 'Ready to Find Your Next Obsession?',
    subtitle: 'Join 500,000+ players discovering genuine Roblox games. No algorithms. No noise. Just great games.',
    buttonText: 'Start Shuffling Free',
    buttonHref: 'https://app.whatblox.com',
  },
  footer: {
    brand: 'WhatBlox',
    tagline: 'Human-curated Roblox discovery. No algorithms, no bots, no nonsense.',
    links: [
      { label: 'Explore Games', href: 'https://app.whatblox.com' },
      { label: 'For Developers', href: 'https://app.whatblox.com/developers' },
      { label: 'Submit a Game', href: 'https://app.whatblox.com/submit' },
      { label: 'Blog', href: 'https://blog.whatblox.com' },
      { label: 'Privacy', href: 'https://whatblox.com/privacy' },
      { label: 'Terms', href: 'https://whatblox.com/terms' },
    ],
    social: [
      { icon: Globe, href: 'https://twitter.com/whatblox', label: 'Twitter' },
      { icon: Gamepad2, href: 'https://discord.gg/whatblox', label: 'Discord' },
      { icon: Sparkles, href: 'https://github.com/whatblox', label: 'GitHub' },
    ],
    copyright: '© 2025 WhatBlox. Not affiliated with Roblox Corporation.',
  },
};

function GameCard({ game, className = "", onPlay }: { game: RobloxGame; className?: string; onPlay: (url: string) => void }) {
  const CurrentIcon = getIcon(game.icon_name);
  const gradient = getGradient(game.gradient_from, game.gradient_to);
  const [isHovered, setIsHovered] = useState(false);

  const formatPlayers = (n: number) => n.toLocaleString('en-US');

  return (
    <div
      className={`wb-landing-card ${className} ${isHovered ? 'wb-landing-card--hover' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <article className="wb-landing-game-card">
        <div
          className="wb-landing-banner"
          style={{
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
          }}
        >
          <div className="wb-landing-banner-texture" />
          <CurrentIcon className="wb-landing-banner-icon" strokeWidth={1.25} />
          <span className="wb-landing-badge wb-landing-badge--genre">{game.genre}</span>
          <span className="wb-landing-badge wb-landing-badge--live">
            <span className="wb-landing-live-dot" />
            {formatPlayers(game.players_now)} playing
          </span>
        </div>

        <div className="wb-landing-card-body">
          <div className="wb-landing-card-heading">
            <div>
              <h3 className="wb-landing-game-title">{game.title}</h3>
              <span className="wb-landing-developer">by {game.developer}</span>
            </div>
            <div className="wb-landing-visits">
              <Users size={14} strokeWidth={2} />
              <span>{game.total_visits.toLocaleString()} visits</span>
            </div>
          </div>

          <ScrollArea className="wb-landing-description">
            {game.description}
          </ScrollArea>

          <div className="wb-landing-cta-row">
            <Button
              className="wb-landing-btn wb-landing-btn--primary"
              onClick={() => onPlay(game.roblox_url)}
              type="button"
            >
              <Play size={15} strokeWidth={2.25} fill="currentColor" />
              Play Now
            </Button>
            <Button variant="ghost" className="wb-landing-btn wb-landing-btn--ghost" type="button">
              <ChevronRight size={15} strokeWidth={2.25} />
              Details
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}

interface GameCarouselProps {
  games: RobloxGame[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

function GameCarousel({ games, autoPlay = true, autoPlayInterval = 5000 }: GameCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const next = useCallback(() => {
    goTo((activeIndex + 1) % games.length);
  }, [activeIndex, games.length, goTo]);

  const prev = useCallback(() => {
    goTo((activeIndex - 1 + games.length) % games.length);
  }, [activeIndex, games.length, goTo]);

  useEffect(() => {
    if (!autoPlay) return;
    intervalRef.current = window.setInterval(next, autoPlayInterval);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [autoPlay, autoPlayInterval, next]);

  const handlePlay = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="wb-landing-carousel">
      <div className="wb-landing-carousel-track">
        {games.map((game, index) => {
          const diff = (index - activeIndex + games.length) % games.length;
          const isPrev = diff === games.length - 1;
          const isNext = diff === 1;
          let className = "";
          if (index === activeIndex) className = "wb-landing-card--active";
          else if (isPrev) className = "wb-landing-card--prev";
          else if (isNext) className = "wb-landing-card--next";
          
          return (
            <GameCard
              key={game.id}
              game={game}
              className={className}
              onPlay={handlePlay}
            />
          );
        })}
      </div>

      <div className="wb-landing-carousel-nav">
        <Button
          variant="ghost"
          size="icon"
          className="wb-landing-nav-btn"
          onClick={prev}
          aria-label="Previous game"
          type="button"
        >
          <ChevronRight size={20} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
        </Button>
        <div className="wb-landing-dots" role="tablist" aria-label="Game carousel navigation">
          {games.map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Go to game ${index + 1}`}
              className={`wb-landing-dot ${index === activeIndex ? 'wb-landing-dot--active' : ''}`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="wb-landing-nav-btn"
          onClick={next}
          aria-label="Next game"
          type="button"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
}

export function LandingPage({ content = defaultLandingContent }: { content?: LandingContent }) {
  const { games, loading, error } = useGames();
  const [mounted, setMounted] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (window.location.pathname === '/maintenance') {
      setShowMaintenance(true);
    }
  }, []);

  if (showMaintenance) {
    return <MaintenancePage />;
  }

  if (!mounted) {
    return <SkeletonPage />;
  }

  if (loading) {
    return <SkeletonPage />;
  }

  if (error || games.length === 0) {
    return (
      <div className="wb-landing-page">
        <div className="wb-landing-grain" aria-hidden="true" />
        <main className="wb-landing-main">
          <section className="wb-landing-hero">
            <div className="wb-landing-container">
              <span className="wb-landing-badge wb-landing-badge--hero">Unable to Load Games</span>
              <h1 className="wb-landing-headline">Something went wrong</h1>
              <p className="wb-landing-subheadline">We couldn\'t load the game showcase. Please try again later.</p>
            </div>
          </section>
        </main>
        <style>{landingStyles}</style>
      </div>
    );
  }

  const showcaseGames = games.slice(0, 6);

  return (
    <div className="wb-landing-page">
      <div className="wb-landing-grain" aria-hidden="true" />

      <header className="wb-landing-header">
        <div className="wb-landing-container wb-landing-header-inner">
          <div className="wb-landing-brand">
            <img src="/src/assets/logo.png" alt="WhatBlox" className="wb-landing-logo-img" />
            <span className="wb-wordmark">WhatBlox</span>
          </div>
          <nav className="wb-landing-nav">
            <div className="wb-landing-nav-links">
              <a href="#features" className="wb-landing-nav-link wb-pill wb-pill--ghost">Features</a>
              <a href="#how-it-works" className="wb-landing-nav-link wb-pill wb-pill--ghost">How It Works</a>
              <a href="#showcase" className="wb-landing-nav-link wb-pill wb-pill--ghost">Showcase</a>
            </div>
            <Button variant="white" className="wb-pill wb-pill--solid" asChild>
              <a href={content.hero.ctaPrimary.href}>{content.hero.ctaPrimary.text}</a>
            </Button>
          </nav>
        </div>
      </header>

      <main className="wb-landing-main">
        <section className="wb-landing-hero" aria-labelledby="hero-headline">
          <div className="wb-landing-container">
            <h1 id="hero-headline" className="wb-landing-headline" dangerouslySetInnerHTML={{ __html: content.hero.headline }} />
            <p className="wb-landing-subheadline" dangerouslySetInnerHTML={{ __html: content.hero.subheadline }} />
            <div className="wb-landing-hero-ctas">
              <Button variant="white" className="wb-landing-btn wb-landing-btn--hero wb-landing-btn--primary" asChild>
                <a href={content.hero.ctaPrimary.href}>
                  <Play size={18} strokeWidth={2.5} fill="currentColor" style={{ marginRight: 8 }} />
                  {content.hero.ctaPrimary.text}
                </a>
              </Button>
              <Button variant="ghost" className="wb-landing-btn wb-landing-btn--hero wb-landing-btn--ghost" asChild>
                <a href={content.hero.ctaSecondary.href}>{content.hero.ctaSecondary.text}</a>
              </Button>
            </div>
            <div className="wb-landing-trust">
              <span className="wb-landing-trust-item">
                <Shield size={14} strokeWidth={2} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                No bots
              </span>
              <span className="wb-landing-trust-item">
                <Sparkles size={14} strokeWidth={2} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Human curated
              </span>
              <span className="wb-landing-trust-item">
                <Gamepad2 size={14} strokeWidth={2} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Real games
              </span>
            </div>
          </div>
        </section>

        <section id="stats" className="wb-landing-stats" aria-label="Platform statistics">
          <div className="wb-landing-container">
            <div className="wb-landing-stats-grid">
              {content.stats.map((stat, index) => (
                <div key={index} className="wb-landing-stat">
                  <stat.icon size={28} strokeWidth={1.5} className="wb-landing-stat-icon" />
                  <div className="wb-landing-stat-value">{stat.value}</div>
                  <div className="wb-landing-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="wb-landing-features" aria-labelledby="features-heading">
          <div className="wb-landing-container">
            <div className="wb-landing-section-header">
              <h2 id="features-heading" className="wb-landing-section-title">Why WhatBlox?</h2>
              <p className="wb-landing-section-subtitle">Built for players who are tired of algorithmic noise and want genuine discoveries.</p>
            </div>
            <div className="wb-landing-features-grid">
              {content.features.map((feature, index) => (
                <Card key={index} className="wb-landing-feature-card">
                  <CardContent className="wb-landing-feature-content">
                    <div
                      className="wb-landing-feature-icon"
                      style={{
                        background: `linear-gradient(135deg, ${feature.gradient[0]}, ${feature.gradient[1]})`,
                      }}
                    >
                      <feature.icon size={24} strokeWidth={2} className="wb-landing-feature-icon-svg" />
                    </div>
                    <h3 className="wb-landing-feature-title">{feature.title}</h3>
                    <p className="wb-landing-feature-description">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="wb-landing-how" aria-labelledby="how-heading">
          <div className="wb-landing-container">
            <div className="wb-landing-section-header">
              <h2 id="how-heading" className="wb-landing-section-title">How It Works</h2>
              <p className="wb-landing-section-subtitle">Four simple steps to your next favorite game.</p>
            </div>
            <div className="wb-landing-how-grid">
              {content.howItWorks.map((step, index) => (
                <div key={index} className="wb-landing-step">
                  <div className="wb-landing-step-number">{step.step}</div>
                  <div
                    className="wb-landing-step-icon"
                    style={{ background: 'linear-gradient(135deg, var(--wb-accent), #9B59B6)' }}
                  >
                    <step.icon size={22} strokeWidth={2} className="wb-landing-step-icon-svg" />
                  </div>
                  <h3 className="wb-landing-step-title">{step.title}</h3>
                  <p className="wb-landing-step-description">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="showcase" className="wb-landing-showcase" aria-labelledby="showcase-heading">
          <div className="wb-landing-container">
            <div className="wb-landing-section-header">
              <h2 id="showcase-heading" className="wb-landing-section-title">{content.showcase.title}</h2>
              <p className="wb-landing-section-subtitle">{content.showcase.subtitle}</p>
            </div>
            <GameCarousel games={showcaseGames} autoPlayInterval={5000} />
          </div>
        </section>

        <section className="wb-landing-cta" aria-labelledby="cta-heading">
          <div className="wb-landing-container">
            <div className="wb-landing-cta-content">
              <h2 id="cta-heading" className="wb-landing-cta-title">{content.cta.title}</h2>
              <p className="wb-landing-cta-subtitle">{content.cta.subtitle}</p>
              <Button variant="white" className="wb-landing-btn wb-landing-btn--cta" asChild>
                <a href={content.cta.buttonHref}>
                  {content.cta.buttonText}
                  <ArrowRight size={18} strokeWidth={2.5} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="wb-landing-footer" role="contentinfo">
        <div className="wb-landing-container">
          <div className="wb-landing-footer-grid">
            <div className="wb-landing-footer-brand">
              <span className="wb-landing-footer-logo">{content.footer.brand}</span>
              <p className="wb-landing-footer-tagline">{content.footer.tagline}</p>
              <div className="wb-landing-social">
                {content.footer.social.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="wb-landing-social-link"
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon size={20} strokeWidth={2} />
                  </a>
                ))}
              </div>
            </div>
            <nav className="wb-landing-footer-links" aria-label="Footer navigation">
              {content.footer.links.map((link, index) => (
                <a key={index} href={link.href} className="wb-landing-footer-link">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="wb-landing-footer-bottom">
            <p className="wb-landing-copyright">{content.footer.copyright}</p>
          </div>
        </div>
      </footer>

      <style>{landingStyles}</style>
    </div>
  );
}

const landingStyles = `
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
    --wb-accent-soft: rgba(109, 106, 247, 0.15);
    --wb-green: #4ADE80;
    --wb-amber: #F59E0B;
    --wb-rose: #F43F5E;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: var(--wb-bg);
  }

  .wb-landing-page {
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

  .wb-landing-grain {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.35;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    background-size: 180px 180px;
  }

  .wb-landing-page > * { position: relative; z-index: 1; }

  .wb-landing-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 clamp(16px, 4vw, 64px);
  }

  /* Header */
  .wb-landing-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    border-bottom: 1px solid var(--wb-line);
    background: rgba(22, 22, 23, 0.85);
    backdrop-filter: blur(12px);
  }

  .wb-landing-header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
    padding: 0 clamp(16px, 4vw, 64px);
  }

  .wb-landing-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .wb-landing-logo-img {
    width: 44px;
    height: 44px;
    border-radius: 11px;
    flex-shrink: 0;
  }

  .wb-wordmark {
    font-family: 'General Sans', sans-serif;
    font-weight: 600;
    font-size: 22px;
    letter-spacing: -0.01em;
    color: var(--wb-ink);
  }

  .wb-landing-nav {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .wb-landing-nav-links {
    display: flex;
    align-items: center;
    gap: 10px;
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
    text-decoration: none;
    transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
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

  /* Hero */
  .wb-landing-main { padding-top: 72px; }
  .wb-landing-hero {
    min-height: calc(100vh - 72px);
    display: flex;
    align-items: center;
    padding: clamp(60px, 12vw, 120px) 0;
  }

  .wb-landing-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 999px;
    background: var(--wb-accent-soft);
    color: var(--wb-accent);
    border: 1px solid rgba(109, 106, 247, 0.3);
    margin-bottom: 20px;
    animation: wb-fade-up 0.6s ease both;
  }
  .wb-landing-badge--hero {
    font-size: 13px;
    padding: 8px 16px;
  }

  .wb-landing-headline {
    font-family: 'General Sans', sans-serif;
    font-weight: 600;
    font-size: clamp(36px, 8vw, 72px);
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin: 0 0 24px;
    color: var(--wb-ink);
    animation: wb-fade-up 0.6s ease 0.1s both;
  }

  .wb-landing-subheadline {
    max-width: 640px;
    font-size: clamp(16px, 3.5vw, 20px);
    line-height: 1.7;
    color: var(--wb-ink-soft);
    margin: 0 0 32px;
    animation: wb-fade-up 0.6s ease 0.2s both;
  }

  .wb-landing-hero-ctas {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    animation: wb-fade-up 0.6s ease 0.3s both;
  }

  .wb-landing-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border-radius: 12px;
    padding: 14px 28px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
    font-family: 'General Sans', sans-serif;
    text-decoration: none;
  }
  .wb-landing-btn:hover { transform: translateY(-2px); }
  .wb-landing-btn:active { transform: translateY(0); }

  .wb-landing-btn--hero { padding: 16px 32px; font-size: 16px; }
  .wb-landing-btn--primary {
    background: var(--wb-white-pill);
    color: var(--wb-white-pill-ink);
  }
  .wb-landing-btn--primary:hover { opacity: 0.88; }
  .wb-landing-btn--ghost {
    background: transparent;
    border-color: var(--wb-line-strong);
    color: var(--wb-ink);
  }
  .wb-landing-btn--ghost:hover { background: rgba(255,255,255,0.05); }

  .wb-landing-trust {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 24px;
    margin-top: 40px;
    animation: wb-fade-up 0.6s ease 0.4s both;
  }
  .wb-landing-trust-item {
    display: inline-flex;
    align-items: center;
    font-size: 13px;
    color: var(--wb-ink-faint);
    font-weight: 500;
  }

  @keyframes wb-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Stats */
  .wb-landing-stats {
    padding: clamp(48px, 10vw, 80px) 0;
    border-top: 1px solid var(--wb-line);
    border-bottom: 1px solid var(--wb-line);
  }
  .wb-landing-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
    text-align: center;
  }
  .wb-landing-stat-icon {
    color: var(--wb-accent);
    margin-bottom: 12px;
  }
  .wb-landing-stat-value {
    font-family: 'General Sans', sans-serif;
    font-weight: 700;
    font-size: clamp(32px, 6vw, 48px);
    line-height: 1.1;
    color: var(--wb-ink);
    margin-bottom: 4px;
  }
  .wb-landing-stat-label {
    font-size: 14px;
    color: var(--wb-ink-soft);
    font-weight: 500;
  }

  /* Features */
  .wb-landing-features {
    padding: clamp(60px, 12vw, 100px) 0;
  }
  .wb-landing-section-header { text-align: center; max-width: 640px; margin: 0 auto 56px; }
  .wb-landing-section-title {
    font-family: 'General Sans', sans-serif;
    font-weight: 600;
    font-size: clamp(28px, 5vw, 42px);
    line-height: 1.15;
    letter-spacing: -0.01em;
    margin: 0 0 12px;
    color: var(--wb-ink);
  }
  .wb-landing-section-subtitle {
    font-size: 16px;
    line-height: 1.65;
    color: var(--wb-ink-soft);
    margin: 0;
  }

  .wb-landing-features-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .wb-landing-feature-card {
    background: var(--wb-panel);
    border: 1px solid var(--wb-line);
    border-radius: 20px;
    padding: 32px 24px;
    transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .wb-landing-feature-card:hover {
    transform: translateY(-4px);
    border-color: var(--wb-line-strong);
    box-shadow: 0 24px 48px -24px rgba(0,0,0,0.6);
  }
  .wb-landing-feature-content { display: flex; flex-direction: column; gap: 16px; }
  .wb-landing-feature-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wb-landing-feature-icon-svg { color: white; }
  .wb-landing-feature-title {
    font-family: 'General Sans', sans-serif;
    font-weight: 600;
    font-size: 18px;
    margin: 0;
    color: var(--wb-ink);
  }
  .wb-landing-feature-description {
    font-size: 14px;
    line-height: 1.65;
    color: var(--wb-ink-soft);
    margin: 0;
  }

  /* How It Works */
  .wb-landing-how {
    padding: clamp(60px, 12vw, 100px) 0;
    background: linear-gradient(180deg, transparent, rgba(109,106,247,0.03), transparent);
  }
  .wb-landing-how-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
  .wb-landing-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px;
    position: relative;
  }
  .wb-landing-step::before {
    content: '';
    position: absolute;
    top: 50%;
    right: -12px;
    width: 24px;
    height: 2px;
    background: linear-gradient(90deg, var(--wb-accent), transparent);
    opacity: 0.4;
  }
  .wb-landing-how-grid > :last-child .wb-landing-step::before { display: none; }
  .wb-landing-step-number {
    font-family: 'General Sans', sans-serif;
    font-weight: 700;
    font-size: 48px;
    line-height: 1;
    color: var(--wb-line);
    margin-bottom: 20px;
  }
  .wb-landing-step-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }
  .wb-landing-step-icon-svg { color: white; }
  .wb-landing-step-title {
    font-family: 'General Sans', sans-serif;
    font-weight: 600;
    font-size: 18px;
    margin: 0 0 10px;
    color: var(--wb-ink);
  }
  .wb-landing-step-description {
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--wb-ink-soft);
    margin: 0;
  }

  /* Showcase / Carousel */
  .wb-landing-showcase {
    padding: clamp(60px, 12vw, 100px) 0;
  }
  .wb-landing-carousel { 
    position: relative; 
    overflow: hidden;
  }
  .wb-landing-carousel-track {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 20px clamp(16px, 4vw, 40px);
    min-height: 520px;
    will-change: transform;
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .wb-landing-card {
    width: 100%;
    max-width: 440px;
    flex: 0 0 auto;
    pointer-events: none;
    opacity: 0.35;
    transform: scale(0.88) translateY(24px);
    filter: blur(1px);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 1;
  }
  .wb-landing-card--active {
    pointer-events: auto;
    opacity: 1;
    transform: scale(1.02) translateY(0);
    filter: none;
    z-index: 10;
  }
  .wb-landing-card--prev,
  .wb-landing-card--next {
    opacity: 0.55;
    transform: scale(0.94) translateY(12px);
    filter: blur(0.5px);
    z-index: 5;
  }
  .wb-landing-game-card {
    width: 100%;
    background: var(--wb-panel);
    border: 1px solid var(--wb-line);
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 24px 60px -30px rgba(0, 0, 0, 0.8);
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .wb-landing-game-card:hover {
    box-shadow: 0 32px 80px -30px rgba(0, 0, 0, 0.9), 0 0 0 1px var(--wb-accent);
    border-color: var(--wb-accent);
  }
  .wb-landing-banner {
    position: relative;
    height: clamp(160px, 28vw, 200px);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .wb-landing-banner-texture {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.10) 1.5px, transparent 1.5px);
    background-size: 18px 18px;
    opacity: 0.6;
  }
  .wb-landing-banner-icon {
    width: clamp(72px, 12vw, 96px);
    height: clamp(72px, 12vw, 96px);
    color: rgba(255, 255, 255, 0.28);
    position: relative;
    z-index: 1;
  }
  .wb-landing-badge {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: clamp(11px, 2.4vw, 12.5px);
    font-weight: 600;
    padding: clamp(6px, 1.4vw, 7px) clamp(9px, 2vw, 12px);
    border-radius: 999px;
    z-index: 2;
  }
  .wb-landing-badge--genre {
    top: 16px;
    left: 16px;
    background: var(--wb-white-pill);
    color: var(--wb-white-pill-ink);
  }
  .wb-landing-badge--live {
    top: 16px;
    right: 16px;
    background: rgba(12, 12, 13, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--wb-ink);
    backdrop-filter: blur(6px);
    font-size: 12px;
  }
  .wb-landing-live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--wb-green);
    box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.2);
  }
  .wb-landing-card-body {
    padding: clamp(18px, 4vw, 26px) clamp(16px, 4.5vw, 28px) clamp(20px, 4.5vw, 28px);
    display: flex;
    flex-direction: column;
    gap: clamp(14px, 3vw, 18px);
  }
  .wb-landing-card-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .wb-landing-game-title {
    font-family: 'General Sans', sans-serif;
    font-weight: 600;
    font-size: clamp(21px, 4.5vw, 27px);
    margin: 0 0 4px;
    letter-spacing: -0.01em;
    color: var(--wb-ink);
  }
  .wb-landing-developer {
    font-size: 13px;
    color: var(--wb-ink-faint);
  }
  .wb-landing-visits {
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
  .wb-landing-description {
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
  }
  .wb-landing-description::-webkit-scrollbar { width: 8px; }
  .wb-landing-description::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.14);
    border-radius: 999px;
  }
  .wb-landing-description::-webkit-scrollbar-track { background: transparent; }
  .wb-landing-cta-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .wb-landing-btn--primary {
    background: var(--wb-white-pill);
    color: var(--wb-white-pill-ink);
  }
  .wb-landing-btn--primary:hover { opacity: 0.88; }
  .wb-landing-btn--ghost {
    background: transparent;
    border-color: var(--wb-line-strong);
    color: var(--wb-ink);
  }
  .wb-landing-btn--ghost:hover { background: rgba(255, 255, 255, 0.06); }

  .wb-landing-carousel-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    margin-top: 24px;
  }
  .wb-landing-nav-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--wb-panel);
    border: 1px solid var(--wb-line);
    color: var(--wb-ink-soft);
    transition: all 0.2s ease;
  }
  .wb-landing-nav-btn:hover {
    background: var(--wb-panel-raised);
    border-color: var(--wb-line-strong);
    color: var(--wb-ink);
    transform: scale(1.05);
  }
  .wb-landing-dots {
    display: flex;
    gap: 8px;
  }
  .wb-landing-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--wb-line-strong);
    border: none;
    padding: 0;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
  }
  .wb-landing-dot:hover { background: var(--wb-ink-soft); }
  .wb-landing-dot--active {
    background: var(--wb-accent);
    transform: scale(1.3);
  }

  /* CTA Section */
  .wb-landing-cta {
    padding: clamp(60px, 12vw, 100px) 0;
    background: linear-gradient(180deg, transparent, rgba(109,106,247,0.05), transparent);
    text-align: center;
  }
  .wb-landing-cta-content { max-width: 640px; margin: 0 auto; }
  .wb-landing-cta-title {
    font-family: 'General Sans', sans-serif;
    font-weight: 600;
    font-size: clamp(28px, 5vw, 42px);
    line-height: 1.15;
    letter-spacing: -0.01em;
    margin: 0 0 16px;
    color: var(--wb-ink);
  }
  .wb-landing-cta-subtitle {
    font-size: 16px;
    line-height: 1.65;
    color: var(--wb-ink-soft);
    margin: 0 0 32px;
  }
  .wb-landing-btn--cta {
    padding: 16px 36px;
    font-size: 16px;
  }

  /* Footer */
  .wb-landing-footer {
    padding: clamp(48px, 10vw, 80px) 0 clamp(24px, 5vw, 40px);
    border-top: 1px solid var(--wb-line);
  }
  .wb-landing-footer-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 48px;
    margin-bottom: 40px;
  }
  .wb-landing-footer-brand { max-width: 320px; }
  .wb-landing-footer-logo {
    display: block;
    font-family: 'General Sans', sans-serif;
    font-weight: 600;
    font-size: 22px;
    letter-spacing: -0.01em;
    color: var(--wb-ink);
    margin-bottom: 12px;
  }
  .wb-landing-footer-tagline {
    font-size: 14px;
    line-height: 1.65;
    color: var(--wb-ink-soft);
    margin: 0 0 24px;
  }
  .wb-landing-social {
    display: flex;
    gap: 12px;
  }
  .wb-landing-social-link {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--wb-panel);
    border: 1px solid var(--wb-line);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--wb-ink-soft);
    text-decoration: none;
    transition: all 0.2s ease;
  }
  .wb-landing-social-link:hover {
    background: var(--wb-panel-raised);
    border-color: var(--wb-line-strong);
    color: var(--wb-ink);
    transform: translateY(-2px);
  }
  .wb-landing-footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
    justify-content: flex-end;
  }
  .wb-landing-footer-link {
    font-size: 13.5px;
    color: var(--wb-ink-soft);
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .wb-landing-footer-link:hover { color: var(--wb-ink); }
  .wb-landing-footer-bottom {
    padding-top: 24px;
    border-top: 1px solid var(--wb-line);
    text-align: center;
  }
  .wb-landing-copyright {
    font-size: 12.5px;
    color: var(--wb-ink-faint);
    margin: 0;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .wb-landing-stats-grid,
    .wb-landing-features-grid,
    .wb-landing-how-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .wb-landing-footer-grid {
      grid-template-columns: 1fr;
      gap: 32px;
    }
    .wb-landing-footer-links { justify-content: flex-start; }
  }

  @media (max-width: 640px) {
    .wb-landing-stats-grid,
    .wb-landing-features-grid,
    .wb-landing-how-grid {
      grid-template-columns: 1fr;
    }
    .wb-landing-nav-links {
      display: none;
    }
    .wb-landing-hero-ctas { flex-direction: column; width: 100%; }
    .wb-landing-btn--hero { width: 100%; justify-content: center; }
    .wb-landing-trust { justify-content: center; }
    .wb-landing-card { width: 100%; max-width: 100%; }
    .wb-landing-carousel-track { 
      min-height: auto; 
      padding: 20px clamp(16px, 4vw, 24px);
      gap: 16px;
    }
    .wb-landing-cta { padding: 48px 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .wb-landing-card,
    .wb-landing-feature-card,
    .wb-landing-step,
    .wb-landing-btn,
    .wb-landing-nav-btn,
    .wb-landing-social-link,
    .wb-landing-dot,
    .wb-landing-badge,
    .wb-landing-headline,
    .wb-landing-subheadline,
    .wb-landing-trust-item {
      animation: none !important;
      transition: none !important;
    }
  }
`;