import { type CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`wb-skeleton ${className}`}
      style={{
        background: 'linear-gradient(90deg, var(--wb-panel-raised) 25%, var(--wb-line-strong) 37%, var(--wb-panel-raised) 63%)',
        backgroundSize: '400% 100%',
        animation: 'wb-shimmer 1.4s ease-in-out infinite',
        borderRadius: '8px',
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <article className="wb-card wb-skeleton-card">
      <div className="wb-banner wb-skeleton-banner" />
      <div className="wb-card-body wb-skeleton-body">
        <div className="wb-skeleton-row">
          <Skeleton className="wb-skeleton-title" style={{ width: '60%', height: '28px' }} />
          <Skeleton className="wb-skeleton-visits" style={{ width: '120px', height: '28px' }} />
        </div>
        <Skeleton className="wb-skeleton-desc" style={{ height: '200px' }} />
        <div className="wb-skeleton-row wb-skeleton-cta">
          <Skeleton style={{ width: '140px', height: '44px', borderRadius: '12px' }} />
          <Skeleton style={{ width: '130px', height: '44px', borderRadius: '12px' }} />
        </div>
      </div>
    </article>
  );
}

export function SkeletonHeader() {
  return (
    <header className="wb-header wb-skeleton-header">
      <div className="wb-brand">
        <Skeleton className="wb-logo-slot" style={{ width: 36, height: 36, borderRadius: '9px' }} />
        <Skeleton className="wb-wordmark" style={{ width: 120, height: 22 }} />
      </div>
      <nav className="wb-nav">
        <div className="wb-nav-links">
          <Skeleton className="wb-pill" style={{ width: 100, height: 38, borderRadius: '999px' }} />
          <Skeleton className="wb-pill" style={{ width: 140, height: 38, borderRadius: '999px' }} />
        </div>
        <Skeleton className="wb-pill wb-pill--solid" style={{ width: 150, height: 38, borderRadius: '999px' }} />
      </nav>
    </header>
  );
}

export function SkeletonHero() {
  return (
    <section className="wb-hero wb-skeleton-hero">
      <Skeleton className="wb-skeleton-headline" style={{ width: '80%', maxWidth: '500px', height: '56px', margin: '0 auto 16px' }} />
      <Skeleton className="wb-skeleton-subhead" style={{ width: '70%', maxWidth: '480px', height: '20px', margin: '0 auto' }} />
    </section>
  );
}

export function SkeletonShuffle() {
  return (
    <div className="wb-shuffle-row wb-skeleton-shuffle">
      <div className="wb-shuffle-btn-wrap">
        <Skeleton className="wb-shuffle-btn" style={{ width: 56, height: 56, borderRadius: '50%' }} />
      </div>
      <div className="wb-shuffle-meta">
        <Skeleton className="wb-skeleton-label" style={{ width: 80, height: 18 }} />
        <div className="wb-dots wb-skeleton-dots">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="wb-dot" style={{ width: 7, height: 7, borderRadius: '50%' }} />
          ))}
        </div>
        <Skeleton className="wb-skeleton-count" style={{ width: 120, height: 14 }} />
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="wb-page wb-skeleton-page">
      <div className="wb-grain" aria-hidden="true" />
      <SkeletonHeader />
      <main className="wb-main wb-skeleton-main">
        <SkeletonHero />
        <section className="wb-card-wrap wb-skeleton-wrap">
          <SkeletonCard />
          <SkeletonShuffle />
        </section>
      </main>
      <style>{`
        @keyframes wb-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .wb-skeleton-page {
          opacity: 1;
          transition: opacity 0.4s ease;
        }

        .wb-page:has(.wb-skeleton-page) .wb-main,
        .wb-page:has(.wb-skeleton-page) .wb-header,
        .wb-page:has(.wb-skeleton-page) .wb-hero,
        .wb-page:has(.wb-skeleton-page) .wb-card-wrap {
          opacity: 0;
          pointer-events: none;
        }

        .wb-skeleton-header {
          animation: wb-fade-in 0.4s ease forwards;
        }

        .wb-skeleton-hero {
          animation: wb-fade-in 0.4s ease 0.1s forwards;
          opacity: 0;
        }

        .wb-skeleton-wrap {
          animation: wb-fade-in 0.4s ease 0.2s forwards;
          opacity: 0;
        }

        .wb-skeleton-card {
          animation: wb-card-in 0.4s ease 0.3s forwards;
          opacity: 0;
        }

        .wb-skeleton-shuffle {
          animation: wb-fade-in 0.4s ease 0.4s forwards;
          opacity: 0;
        }

        @keyframes wb-fade-in {
          to { opacity: 1; }
        }

        .wb-skeleton-banner {
          height: clamp(180px, 30vw, 240px);
          border-radius: 22px 22px 0 0;
        }

        .wb-skeleton-body {
          padding: clamp(18px, 4vw, 26px) clamp(16px, 4.5vw, 28px) clamp(20px, 4.5vw, 28px);
        }

        .wb-skeleton-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .wb-skeleton-title { border-radius: 6px; }
        .wb-skeleton-visits { border-radius: 999px; }
        .wb-skeleton-desc { border-radius: 14px; margin: 16px 0; }
        .wb-skeleton-cta { margin-top: 8px; }
        .wb-skeleton-cta .wb-skeleton { border-radius: 12px; }

        .wb-skeleton-label { border-radius: 4px; }
        .wb-skeleton-dots { display: flex; gap: 6px; margin: 8px 0; }
        .wb-skeleton-count { border-radius: 4px; }

        @media (prefers-reduced-motion: reduce) {
          .wb-skeleton,
          .wb-skeleton-header,
          .wb-skeleton-hero,
          .wb-skeleton-wrap,
          .wb-skeleton-card,
          .wb-skeleton-shuffle {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}