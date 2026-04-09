'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';

import { cn } from '@/lib/utils';

interface Section {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
}

const BRAND_COLOR = '#00D4FF';

const SECTIONS: Section[] = [
  {
    id: 'hero',
    label: 'Home',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'cup',
    label: 'Trencher Cup',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'traders',
    label: 'Leaderboard',
    href: '/leaderboard',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'journey',
    label: 'Journey',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    id: 'referrals',
    label: 'Referrals',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'login',
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
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
    <div className="fixed top-4 right-3 z-30 md:top-5 md:right-4 lg:top-7 lg:right-5">
          <div
            className="absolute left-1/2 bottom-full h-[200vh] w-[3px] -translate-x-1/2"
            style={{
              background: `linear-gradient(to top, ${BRAND_COLOR}80 0%, ${BRAND_COLOR}4d 40%, transparent 100%)`,
            }}
          />

          <div className="relative p-2">
            <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 overflow-hidden rounded-full bg-gray-700/50">
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
                      className="group relative flex h-9 w-9 items-center justify-center"
                      aria-label={`Go to ${section.label}`}
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
                        {section.icon}
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
                          <div className="whitespace-nowrap rounded-lg border border-gray-700/60 bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-xl shadow-black/30">
                            {section.label}
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
