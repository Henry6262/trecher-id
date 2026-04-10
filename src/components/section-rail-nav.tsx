'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, House, LayoutDashboard, Link2, Route, Trophy } from 'lucide-react';

import { cn } from '@/lib/utils';

interface Section {
  id: string;
  label: string;
  tooltipTitle: string;
  tooltipHint: string;
  icon: LucideIcon;
  href?: string;
}

const BRAND_COLOR = '#00D4FF';

const SECTIONS: Section[] = [
  {
    id: 'hero',
    label: 'Land',
    tooltipTitle: 'Landing',
    tooltipHint: 'Overview and featured profile',
    icon: House,
  },
  {
    id: 'cup',
    label: 'Cup',
    tooltipTitle: 'Trencher Cup',
    tooltipHint: 'Groups, bracket, and standings',
    icon: Trophy,
  },
  {
    id: 'traders',
    label: 'Ranks',
    tooltipTitle: 'Leaderboard',
    tooltipHint: 'Trader and dev rankings',
    href: '/leaderboard',
    icon: BarChart3,
  },
  {
    id: 'journey',
    label: 'Flow',
    tooltipTitle: 'How It Works',
    tooltipHint: 'Claim, sync, and share',
    icon: Route,
  },
  {
    id: 'referrals',
    label: 'Refs',
    tooltipTitle: 'Referral Loop',
    tooltipHint: 'Invite flow and rewards',
    icon: Link2,
  },
  {
    id: 'login',
    label: 'App',
    tooltipTitle: 'Dashboard',
    tooltipHint: 'Wallets, trades, and referrals',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
];

export function SectionRailNav(): ReactNode {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const prevActiveSection = useRef(0);

  useEffect(() => {
    const handleScroll = (): void => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollProgress(progress);

      const sectionElements = SECTIONS.map((section) => document.getElementById(section.id)).filter(Boolean);
      const viewportMiddle = scrollTop + window.innerHeight / 3;

      for (let i = sectionElements.length - 1; i >= 0; i -= 1) {
        const element = sectionElements[i];
        if (element && element.offsetTop <= viewportMiddle) {
          if (i !== prevActiveSection.current) {
            setScrollDirection(i > prevActiveSection.current ? 'down' : 'up');
            prevActiveSection.current = i;
          }

          setActiveSection(i);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateToSection = (section: Section): void => {
    if (section.href) {
      window.location.assign(section.href);
      return;
    }

    const element = document.getElementById(section.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed top-4 right-3 z-10 pointer-events-none md:top-5 md:right-4 lg:top-7 lg:right-5">
          <div
            className="absolute left-1/2 bottom-full h-[200vh] w-[3px] -translate-x-1/2"
            style={{
              background: `linear-gradient(to top, ${BRAND_COLOR}80 0%, ${BRAND_COLOR}4d 40%, transparent 100%)`,
            }}
          />

          <div className="relative p-2 pointer-events-auto">
            <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 overflow-hidden rounded-full bg-gray-700/50 pointer-events-none">
              <m.div
                className="w-full"
                style={{
                  height: `${scrollProgress * 100}%`,
                  background: `linear-gradient(to bottom, ${BRAND_COLOR} 0%, ${BRAND_COLOR}cc 60%, ${BRAND_COLOR}66 100%)`,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <div className="relative flex flex-col items-center rounded-2xl ring-1 ring-gray-700/50">
              {SECTIONS.map((section, index) => {
                const isActive = index === activeSection;
                const isPast = index < activeSection;
                const isHovered = hoveredIndex === index;
                const isFirst = index === 0;
                const isLast = index === SECTIONS.length - 1;

                const getBorderRadius = (): string => {
                  if (isFirst) return 'rounded-t-2xl';
                  if (isLast) return 'rounded-b-2xl';
                  return '';
                };

                return (
                  <div key={section.id} className="relative">
                    <button
                      onClick={() => navigateToSection(section)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="group relative flex h-9 w-9 items-center justify-center pointer-events-auto"
                      aria-label={`Go to ${section.tooltipTitle}`}
                    >
                      <div className={cn('absolute inset-0 bg-gray-900', getBorderRadius())} />

                      <div
                        className={cn(
                          'absolute inset-0.5 overflow-hidden transition-all duration-300',
                          getBorderRadius(),
                          isActive
                            ? ''
                            : isPast
                              ? ''
                              : 'bg-gray-800/80 group-hover:bg-gray-700/80',
                        )}
                        style={isActive ? { backgroundColor: BRAND_COLOR } : undefined}
                      >
                        {isActive && (
                          <m.div
                            className="absolute inset-0 shadow-lg"
                            style={{
                              background: BRAND_COLOR,
                              boxShadow: `0 0 24px ${BRAND_COLOR}4d`,
                            }}
                            initial={{
                              clipPath:
                                scrollDirection === 'down'
                                  ? 'inset(0% 0% 100% 0%)'
                                  : 'inset(100% 0% 0% 0%)',
                            }}
                            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                            transition={{
                              duration: 0.35,
                              ease: [0.4, 0, 0.2, 1],
                            }}
                          />
                        )}

                        {isPast && !isActive && (
                          <m.div
                            className="absolute inset-0"
                            style={{ background: `${BRAND_COLOR}26` }}
                            whileHover={{ backgroundColor: `${BRAND_COLOR}40` }}
                            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
                            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                            transition={{
                              duration: 0.3,
                              ease: [0.4, 0, 0.2, 1],
                            }}
                          />
                        )}
                      </div>

                      <m.div
                        className="absolute inset-0"
                        animate={{ scale: isActive ? 1.08 : isHovered ? 1.02 : 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      />

                      <m.div
                        className={cn(
                          'relative z-10 transition-colors duration-200',
                          isActive
                            ? 'text-gray-950'
                            : isPast
                              ? ''
                              : 'text-gray-500 group-hover:text-gray-300',
                        )}
                        style={isPast && !isActive ? { color: BRAND_COLOR } : undefined}
                        animate={{ scale: isActive ? 1.15 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <section.icon className="h-3.5 w-3.5" strokeWidth={2} />
                      </m.div>

                      {isActive && (
                        <m.div
                          layoutId="activeGlow"
                          className={cn(
                            'absolute inset-[-3px] -z-10 opacity-50 blur-lg',
                            isFirst ? 'rounded-t-3xl' : isLast ? 'rounded-b-3xl' : '',
                          )}
                          style={{ background: BRAND_COLOR }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>

                    <AnimatePresence>
                      {isHovered && (
                        <m.div
                          initial={{ opacity: 0, x: 8, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 8, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="pointer-events-none absolute right-full top-1/2 mr-4 -translate-y-1/2"
                        >
                          <div className="min-w-[176px] rounded-lg border border-gray-700/60 bg-gray-900 px-4 py-3 shadow-xl shadow-black/30">
                            <div className="text-[9px] font-mono uppercase tracking-[2px] text-[var(--trench-accent)]">
                              {section.label}
                            </div>
                            <div className="mt-1 whitespace-nowrap text-sm font-semibold text-white">
                              {section.tooltipTitle}
                            </div>
                            <div className="mt-1 whitespace-nowrap text-[11px] text-gray-400">
                              {section.tooltipHint}
                            </div>
                          </div>
                          <div className="absolute top-1/2 right-[-6px] h-3 w-3 -translate-y-1/2 rotate-45 border-t border-r border-gray-700/60 bg-gray-900" />
                        </m.div>
                      )}
                    </AnimatePresence>

                    {!isLast && (
                      <div className="absolute right-1 bottom-0 left-1 h-px bg-gray-700/40" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
    </div>
  );
}
