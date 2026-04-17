'use client';

import type { CSSProperties, ComponentType, MouseEvent } from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, BarChart3, ExternalLink, Globe2, LayoutDashboard, Lock } from 'lucide-react';

type NavCard = {
  label: string;
  description: string;
  href?: string;
  accent: string;
  eyebrow: string;
  featured?: boolean;
  external?: boolean;
  comingSoon?: boolean;
  links: Array<{
    label: string;
    href?: string;
    icon: ComponentType<{ className?: string }>;
    external?: boolean;
    disabled?: boolean;
  }>;
};

function XIcon({ className }: { className?: string }) {
  return <span className={className}>X</span>;
}

const X_URL = 'https://x.com/web3me';
const NAV_CARDS: NavCard[] = [
  {
    label: 'Home',
    description: 'Start from the main landing surface and move through the product from one clear public entry point.',
    href: '/',
    accent: '#00D4FF',
    eyebrow: 'Landing',
    featured: true,
    links: [
      { label: 'Main Surface', href: '/', icon: Globe2 },
      { label: 'Cup Section', href: '/#cup', icon: ArrowUpRight },
    ],
  },
  {
    label: 'Leaderboard',
    description: 'Browse the live trader and dev rankings, then drop into the Trencher Cup block from the same page.',
    href: '/leaderboard',
    accent: '#6ee7ff',
    eyebrow: 'Rankings',
    links: [
      { label: 'Trader + Dev', href: '/leaderboard', icon: BarChart3 },
      { label: 'Cup Bracket', href: '/leaderboard#trencher-cup', icon: ArrowUpRight },
    ],
  },
  {
    label: 'Dashboard',
    description: 'Open the authenticated workspace for wallet linking, sync health, profile setup, and the private operating surface.',
    href: '/dashboard',
    accent: '#33ddff',
    eyebrow: 'Workspace',
    links: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Wallets', href: '/dashboard?panel=wallets', icon: ArrowUpRight },
      { label: 'Trades', href: '/dashboard?panel=trades', icon: ArrowUpRight },
    ],
  },
  {
    label: 'Token',
    description: 'View the token contract and trading data on Dexscreener.',
    href: 'https://dexscreener.com/solana/HU5uzDSaiDYBkoHQikf2mRXEEWquRY9xNYM2ErkNpump',
    accent: '#00ff88',
    eyebrow: 'Contract',
    external: true,
    links: [
      { label: 'Dexscreener', href: 'https://dexscreener.com/solana/HU5uzDSaiDYBkoHQikf2mRXEEWquRY9xNYM2ErkNpump', icon: BarChart3, external: true },
    ],
  },
  {
    label: 'X',
    description: 'Follow launch updates, ranking posts, product drops, and account announcements from the main Web3Me feed.',
    href: X_URL,
    accent: '#7fdcff',
    eyebrow: 'Social',
    external: true,
    links: [
      { label: '@web3me', href: X_URL, icon: XIcon, external: true },
    ],
  },
];

function getIsActive(pathname: string, href: string): boolean {
  if (!href.startsWith('/')) {
    return false;
  }

  if (href === '/' || href.startsWith('/#')) {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(pathname !== '/');
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== '/') {
      return;
    }

    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      const scrollY = window.scrollY;
      setHasScrolledPastHero(scrollY > heroHeight * 0.8);
    };

    const frameId = window.requestAnimationFrame(handleScroll);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isExpanded ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (pathname !== '/' || !pendingSectionId) {
      return;
    }

    let attempts = 0;
    let timerId = 0;

    const scrollToPendingSection = () => {
      const element = document.getElementById(pendingSectionId);

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `/#${pendingSectionId}`);
        setPendingSectionId(null);
        return;
      }

      if (attempts >= 24) {
        setPendingSectionId(null);
        return;
      }

      attempts += 1;
      timerId = window.setTimeout(scrollToPendingSection, 50);
    };

    timerId = window.setTimeout(scrollToPendingSection, 40);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [pathname, pendingSectionId]);

  const accentStyle = (accent: string): CSSProperties =>
    ({ ['--accent' as string]: accent }) as CSSProperties;
  const isNavVisible = pathname !== '/' || hasScrolledPastHero;

  const navigateToHref = (href: string) => {
    const [rawPath, rawHash] = href.split('#');
    const path = rawPath || '/';
    const sectionId = rawHash?.trim() || null;

    setIsExpanded(false);

    window.setTimeout(() => {
      if (sectionId && path === '/') {
        if (pathname === '/') {
          const element = document.getElementById(sectionId);

          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.history.replaceState(null, '', `/#${sectionId}`);
            return;
          }
        }

        setPendingSectionId(sectionId);
        router.push(`/#${sectionId}`);
        return;
      }

      if (path === '/') {
        if (pathname === '/') {
          window.history.replaceState(null, '', '/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        router.push('/');
        return;
      }

      router.push(href);
    }, 30);
  };

  const handleNavigate =
    (href: string) =>
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigateToHref(href);
    };

  return (
    <>
      <style>{`
        .web3me-nav-backdrop {
          position: fixed;
          inset: 0;
          z-index: 39;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 0%, rgba(0, 212, 255, 0.18), transparent 30%),
            linear-gradient(180deg, rgba(5, 5, 8, 0.74) 0%, rgba(5, 5, 8, 0.94) 100%);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          transition:
            opacity 0.28s ease,
            visibility 0s linear 0.28s;
        }

        .web3me-nav-backdrop.active {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transition:
            opacity 0.28s ease,
            visibility 0s linear;
        }

        .web3me-nav-shell {
          position: fixed;
          top: 1.5em;
          left: 0;
          right: 0;
          z-index: 40;
          display: flex;
          justify-content: center;
          padding: 0 16px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.35s ease;
        }

        .web3me-nav-shell.visible,
        .web3me-nav-shell.expanded {
          opacity: 1;
        }

        .web3me-nav-shell.hidden:not(.expanded) {
          opacity: 0;
        }

        .web3me-nav-shell.hidden:not(.expanded) .web3me-nav-stack {
          pointer-events: none;
        }

        .web3me-nav-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          pointer-events: none;
        }

        .web3me-nav-combo {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80px;
          pointer-events: auto;
        }

        .web3me-nav-pill {
          position: absolute;
          left: 64px;
          top: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 44px;
          padding-left: 24px;
          padding-right: 10px;
          border-radius: 0 999px 999px 0;
          border: 0;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015)),
            rgba(0, 0, 0, 0.82);
          box-shadow:
            0 16px 32px rgba(0, 0, 0, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(12px) saturate(140%);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
          transition:
            opacity 0.3s ease,
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .web3me-nav-pill:hover {
          transform: translateX(4px);
          box-shadow:
            0 16px 32px rgba(0, 0, 0, 0.34),
            0 0 22px rgba(0, 212, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .web3me-nav-pill.hidden {
          opacity: 0;
          transform: translateX(-36px) scale(0.82);
          pointer-events: none;
        }

        .web3me-nav-pill-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .web3me-nav-lines {
          display: inline-flex;
          flex-direction: column;
          gap: 5px;
          transition: transform 0.2s ease;
          cursor: pointer;
        }

        .web3me-nav-lines:hover {
          transform: scale(1.08);
        }

        .web3me-nav-lines span {
          width: 18px;
          height: 2px;
          border-radius: 999px;
          background: var(--trench-accent);
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.45);
        }

        .web3me-nav-orb {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 999px;
          border: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 50% 38%, rgba(0, 212, 255, 0.12), transparent 58%),
            linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015)),
            rgba(0, 0, 0, 0.84);
          box-shadow:
            0 18px 40px rgba(0,0,0,0.38),
            inset 0 1px 0 rgba(255,255,255,0.04);
          backdrop-filter: blur(12px) saturate(140%);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
          overflow: hidden;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .web3me-nav-orb:hover {
          transform: scale(1.04);
          box-shadow:
            0 18px 40px rgba(0,0,0,0.38),
            0 0 24px rgba(0, 212, 255, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .web3me-nav-logo-link,
        .web3me-nav-close {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .web3me-nav-logo-frame {
          position: relative;
          z-index: 1;
          width: 66px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .web3me-nav-logo-link img {
          width: 100%;
          height: auto;
          max-width: 66px;
          max-height: 50px;
          object-fit: contain;
          filter:
            drop-shadow(0 0 12px rgba(0, 212, 255, 0.32))
            drop-shadow(0 0 20px rgba(0, 212, 255, 0.12));
          transition:
            opacity 0.25s ease,
            transform 0.25s ease;
        }

        .web3me-nav-logo-link.hidden img {
          opacity: 0;
          transform: scale(0.6) rotate(-15deg);
        }

        .web3me-nav-close {
          opacity: 0;
          transform: scale(0.4) rotate(-180deg);
          pointer-events: none;
          cursor: pointer;
          transition:
            opacity 0.25s ease-out,
            transform 0.25s ease-out;
        }

        .web3me-nav-close.visible {
          opacity: 1;
          transform: scale(1) rotate(0deg);
          pointer-events: auto;
        }

        .web3me-nav-close-line {
          position: absolute;
          width: 24px;
          height: 2.5px;
          background: var(--trench-accent);
          border-radius: 999px;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.32);
        }

        .web3me-nav-close-line:first-child {
          transform: rotate(45deg);
        }

        .web3me-nav-close-line:last-child {
          transform: rotate(-45deg);
        }

        .web3me-nav-panel {
          width: min(1080px, calc(100vw - 32px));
          max-height: calc(100vh - 150px);
          overflow: auto;
          padding: 10px;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)),
            rgba(6, 8, 12, 0.92);
          box-shadow:
            0 28px 80px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.05);
          backdrop-filter: blur(24px) saturate(140%);
          -webkit-backdrop-filter: blur(24px) saturate(140%);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(-10px) scale(0.98);
          transition:
            opacity 0.24s ease,
            transform 0.24s ease,
            visibility 0s linear 0.24s;
        }

        .web3me-nav-panel.active {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0) scale(1);
          transition:
            opacity 0.24s ease,
            transform 0.24s ease,
            visibility 0s linear;
        }

        .web3me-nav-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        .web3me-nav-card {
          --accent: var(--trench-accent);
          position: relative;
          overflow: hidden;
          clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
          background:
            linear-gradient(145deg, color-mix(in srgb, var(--accent) 18%, #050508) 0%, rgba(5, 8, 14, 0.96) 72%),
            rgba(5, 8, 14, 0.96);
        }

        .web3me-nav-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--accent) 42%, rgba(255,255,255,0.12)) 0%,
            rgba(255,255,255,0.06) 30%,
            rgba(255,255,255,0.02) 100%
          );
          opacity: 0.94;
        }

        .web3me-nav-card::after {
          content: '';
          position: absolute;
          inset: 1px;
          clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px));
          background:
            linear-gradient(180deg, rgba(255,255,255,0.04), transparent 42%),
            rgba(6, 8, 12, 0.95);
        }

        .web3me-nav-card-inner {
          position: relative;
          z-index: 1;
          min-height: 232px;
          display: flex;
          flex-direction: column;
          padding: 22px;
        }

        .web3me-nav-card.featured .web3me-nav-card-inner {
          min-height: 248px;
          padding: 24px;
        }

        .web3me-nav-card.coming-soon::after {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.025), transparent 42%),
            rgba(7, 9, 13, 0.98);
        }

        .web3me-nav-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .web3me-nav-card-eyebrow {
          margin: 0 0 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--accent) 76%, white);
        }

        .web3me-nav-card-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .web3me-nav-card-title {
          display: inline-block;
          color: white;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .web3me-nav-card-title:hover {
          color: color-mix(in srgb, var(--accent) 74%, white);
        }

        .web3me-nav-card-title.disabled {
          color: rgba(255,255,255,0.72);
          cursor: default;
        }

        .web3me-nav-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.64);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .web3me-nav-card-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          color: var(--accent);
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .web3me-nav-card-arrow:hover {
          transform: translate(2px, -2px);
          background: color-mix(in srgb, var(--accent) 18%, transparent);
        }

        .web3me-nav-card-arrow.disabled {
          border-color: rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.52);
          cursor: default;
        }

        .web3me-nav-card-copy {
          margin-top: 14px;
          font-size: 13px;
          line-height: 1.55;
          color: rgba(255,255,255,0.6);
        }

        .web3me-nav-card-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: auto;
          padding-top: 18px;
        }

        .web3me-nav-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.76);
          font-size: 12px;
          transition:
            border-color 0.18s ease,
            background 0.18s ease,
            color 0.18s ease;
        }

        .web3me-nav-chip:hover,
        .web3me-nav-chip.active {
          border-color: color-mix(in srgb, var(--accent) 32%, transparent);
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          color: color-mix(in srgb, var(--accent) 76%, white);
        }

        .web3me-nav-chip.disabled {
          border-color: rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          color: rgba(255,255,255,0.5);
          cursor: default;
        }

        @media (max-width: 1080px) {
          .web3me-nav-grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .web3me-nav-shell {
            top: 12px;
            padding: 0 12px;
            justify-content: center;
          }

          .web3me-nav-combo {
            transform: scale(0.92);
            transform-origin: top center;
          }

          .web3me-nav-panel {
            width: calc(100vw - 24px);
            max-height: calc(100vh - 136px);
          }

          .web3me-nav-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>

      <div
        className={`web3me-nav-backdrop ${isExpanded ? 'active' : ''}`}
        onClick={() => setIsExpanded(false)}
        aria-hidden="true"
      />

      <header
        className={`web3me-nav-shell ${isNavVisible ? 'visible' : 'hidden'} ${isExpanded ? 'expanded' : ''}`}
      >
        <div className="web3me-nav-stack">
          <div className="web3me-nav-combo">
            <button
              type="button"
              className={`web3me-nav-pill ${isExpanded ? 'hidden' : ''}`}
              onClick={() => setIsExpanded((open) => !open)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Close navigation panel' : 'Open navigation panel'}
            >
              <span className="web3me-nav-pill-inner">
                <span className="web3me-nav-lines" aria-hidden="true">
                  <span />
                  <span />
                </span>
              </span>
            </button>

            <div className="web3me-nav-orb">
              {isExpanded ? (
                <button
                  type="button"
                  className={`web3me-nav-close ${isExpanded ? 'visible' : ''}`}
                  onClick={() => setIsExpanded(false)}
                  aria-label="Close navigation panel"
                >
                  <span className="web3me-nav-close-line" />
                  <span className="web3me-nav-close-line" />
                </button>
              ) : (
                <Link
                  href="/"
                  className={`web3me-nav-logo-link ${isExpanded ? 'hidden' : ''}`}
                  aria-label="Go to Web3Me home"
                  onClick={handleNavigate('/')}
                >
                  <span className="web3me-nav-logo-frame">
                    <Image src="/logo.png" alt="Web3Me" width={132} height={100} priority />
                  </span>
                </Link>
              )}
            </div>
          </div>

          <div className={`web3me-nav-panel ${isExpanded ? 'active' : ''}`}>
            <div className="web3me-nav-grid">
              {NAV_CARDS.map((card) => (
                <section
                  key={card.label}
                  className={`web3me-nav-card ${card.featured ? 'featured' : ''} ${card.comingSoon ? 'coming-soon' : ''}`}
                  style={accentStyle(card.accent)}
                >
                  <div className="web3me-nav-card-inner">
                    <div className="web3me-nav-card-head">
                      <div>
                        <p className="web3me-nav-card-eyebrow">{card.eyebrow}</p>
                        <div className="web3me-nav-card-title-row">
                          {card.comingSoon ? (
                            <span className="web3me-nav-card-title disabled">{card.label}</span>
                          ) : card.external && card.href ? (
                            <a
                              href={card.href}
                              target="_blank"
                              rel="noreferrer"
                              className="web3me-nav-card-title"
                              onClick={() => setIsExpanded(false)}
                            >
                              {card.label}
                            </a>
                          ) : (
                            <Link
                              href={card.href || '/'}
                              className="web3me-nav-card-title"
                              onClick={handleNavigate(card.href || '/')}
                            >
                              {card.label}
                            </Link>
                          )}

                          {card.comingSoon ? (
                            <span className="web3me-nav-card-badge">
                              <Lock className="h-3 w-3" />
                              Soon
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {card.comingSoon ? (
                        <span className="web3me-nav-card-arrow disabled" aria-hidden="true">
                          <Lock className="h-4 w-4" />
                        </span>
                      ) : card.external && card.href ? (
                        <a
                          href={card.href}
                          target="_blank"
                          rel="noreferrer"
                          className="web3me-nav-card-arrow"
                          aria-label={`Open ${card.label}`}
                          onClick={() => setIsExpanded(false)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <Link
                          href={card.href || '/'}
                          className="web3me-nav-card-arrow"
                          aria-label={`Open ${card.label}`}
                          onClick={handleNavigate(card.href || '/')}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>

                    <p className="web3me-nav-card-copy">{card.description}</p>

                    <div className="web3me-nav-card-links">
                      {card.links.map((link) => {
                        const Icon = link.icon;
                        const active = link.href ? getIsActive(pathname, link.href) : false;

                        if (link.disabled) {
                          return (
                            <span
                              key={`${card.label}-${link.label}`}
                              className="web3me-nav-chip disabled"
                              style={accentStyle(card.accent)}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {link.label}
                            </span>
                          );
                        }

                        if (link.external && link.href) {
                          return (
                            <a
                              key={link.href}
                              href={link.href}
                              target="_blank"
                              rel="noreferrer"
                              className="web3me-nav-chip"
                              style={accentStyle(card.accent)}
                              onClick={() => setIsExpanded(false)}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {link.label}
                            </a>
                          );
                        }

                        return (
                          <Link
                            key={link.href}
                            href={link.href || '/'}
                            className={`web3me-nav-chip ${active ? 'active' : ''}`}
                            style={accentStyle(card.accent)}
                            onClick={handleNavigate(link.href || '/')}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
