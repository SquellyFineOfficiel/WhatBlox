import {
  Globe,
  Gamepad2,
  Sparkles,
  Mail,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MaintenancePage({ 
  message = "We're making WhatBlox even better. Be right back!",
  estimatedTime = "We'll be back shortly",
  showRetry = true,
  onRetry 
}: { 
  message?: string;
  estimatedTime?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="wb-maintenance-page">
      <div className="wb-maintenance-grain" aria-hidden="true" />
      
      <main className="wb-maintenance-main">
        <div className="wb-maintenance-container">
          <div className="wb-maintenance-brand">
            <span className="wb-maintenance-wordmark">WhatBlox</span>
          </div>

          <h1 className="wb-maintenance-heading">
            Sorry! We&rsquo;re under construction maintenance!
          </h1>

          <p className="wb-maintenance-body">
            {message}
          </p>

          <p className="wb-maintenance-eta">
            {estimatedTime}
          </p>

          <div className="wb-maintenance-social" role="list" aria-label="Social links">
            <a 
              href="https://twitter.com/whatblox" 
              target="_blank" 
              rel="noopener noreferrer"
              className="wb-maintenance-social-link"
              aria-label="Follow us on Twitter"
              role="listitem"
            >
              <Globe size={20} strokeWidth={2} />
            </a>
            <a 
              href="https://discord.gg/whatblox" 
              target="_blank" 
              rel="noopener noreferrer"
              className="wb-maintenance-social-link"
              aria-label="Join our Discord"
              role="listitem"
            >
              <Gamepad2 size={20} strokeWidth={2} />
            </a>
            <a 
              href="https://github.com/whatblox" 
              target="_blank" 
              rel="noopener noreferrer"
              className="wb-maintenance-social-link"
              aria-label="Follow us on GitHub"
              role="listitem"
            >
              <Sparkles size={20} strokeWidth={2} />
            </a>
            <a 
              href="mailto:support@whatblox.com" 
              className="wb-maintenance-social-link"
              aria-label="Email us"
              role="listitem"
            >
              <Mail size={20} strokeWidth={2} />
            </a>
          </div>

          <a 
            href="mailto:support@whatblox.com" 
            className="wb-maintenance-email"
          >
            support@whatblox.com
          </a>

          {showRetry && onRetry && (
            <Button
              variant="white"
              className="wb-maintenance-retry-btn"
              onClick={onRetry}
              type="button"
            >
              <Loader2 className="wb-maintenance-retry-icon" size={16} strokeWidth={2.5} />
              Try Again
            </Button>
          )}
        </div>
      </main>

      <style>{maintenanceStyles}</style>
    </div>
  );
}

const maintenanceStyles = `
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
  }

  .wb-maintenance-page {
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

  .wb-maintenance-grain {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.35;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    background-size: 180px 180px;
  }

  .wb-maintenance-main {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: clamp(40px, 8vw, 80px) clamp(24px, 5vw, 48px);
    text-align: center;
  }

  .wb-maintenance-container {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(24px, 4vw, 32px);
  }

  .wb-maintenance-brand {
    margin-bottom: clamp(8px, 2vw, 16px);
  }

  .wb-maintenance-wordmark {
    font-family: 'General Sans', sans-serif;
    font-weight: 600;
    font-size: clamp(22px, 4vw, 28px);
    letter-spacing: -0.01em;
    color: var(--wb-ink);
  }

  .wb-maintenance-heading {
    font-family: 'General Sans', sans-serif;
    font-weight: 700;
    font-size: clamp(28px, 5vw, 42px);
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin: 0;
    color: var(--wb-ink);
  }

  .wb-maintenance-body {
    font-size: clamp(16px, 2.5vw, 18px);
    line-height: 1.7;
    color: var(--wb-ink-soft);
    margin: 0;
    max-width: 420px;
  }

  .wb-maintenance-eta {
    font-size: clamp(14px, 2vw, 15px);
    line-height: 1.6;
    color: var(--wb-ink-faint);
    margin: 0;
    max-width: 420px;
  }

  .wb-maintenance-social {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(16px, 3vw, 24px);
    margin-top: clamp(8px, 2vw, 16px);
  }

  .wb-maintenance-social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--wb-panel);
    border: 1px solid var(--wb-line);
    color: var(--wb-ink-soft);
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .wb-maintenance-social-link:hover {
    background: var(--wb-panel-raised);
    border-color: var(--wb-line-strong);
    color: var(--wb-ink);
    transform: translateY(-2px);
  }

  .wb-maintenance-social-link:focus-visible {
    outline: 2px solid var(--wb-accent);
    outline-offset: 2px;
  }

  .wb-maintenance-email {
    font-size: 14px;
    color: var(--wb-ink-faint);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .wb-maintenance-email:hover {
    color: var(--wb-accent);
  }

  .wb-maintenance-retry-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 28px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 14px;
    margin-top: clamp(16px, 3vw, 24px);
  }

  .wb-maintenance-retry-icon {
    animation: wb-spin-slow 1.5s linear infinite;
  }

  @keyframes wb-spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .wb-maintenance-retry-icon {
      animation: none !important;
    }
    .wb-maintenance-social-link {
      transition: none !important;
    }
  }
`;

export default MaintenancePage;