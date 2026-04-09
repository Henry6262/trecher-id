'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { BackgroundLayer } from '@/components/background-layer';
import { AvatarImage } from '@/components/avatar-image';
import { ParticipateButton } from './participate-button';

const champ = {
  username: 'beaverd',
  avatarUrl: 'https://pbs.twimg.com/profile_images/1998629858390261760/BwGRReaY_400x400.jpg',
  pnl: '+$1K',
  stat: '69%',
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] font-mono tracking-[4px] uppercase text-[rgba(255,255,255,0.45)]">
      {children}
    </div>
  );
}

function VariantFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-[26px] p-6 sm:p-8"
      style={{
        background: 'linear-gradient(145deg, rgba(6,8,12,0.94) 0%, rgba(5,10,18,0.88) 52%, rgba(6,8,12,0.94) 100%)',
        border: '1px solid rgba(0,212,255,0.12)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.02) inset, 0 30px 80px rgba(0,0,0,0.35)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(0,212,255,0.18), transparent 32%), radial-gradient(circle at bottom left, rgba(0,212,255,0.08), transparent 28%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function ChampionPlate({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="cut-sm relative overflow-hidden px-4 py-4"
      style={{
        background: 'linear-gradient(180deg, rgba(8,12,18,0.92) 0%, rgba(8,12,18,0.75) 100%)',
        border: '1px solid rgba(255,215,0,0.18)',
        boxShadow: '0 0 24px rgba(255,215,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.02)',
      }}
    >
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: 'linear-gradient(180deg, #FFD76A 0%, rgba(255,215,106,0.15) 100%)' }} />
      <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
        <div
          className={`${compact ? 'h-12 w-12' : 'h-14 w-14'} overflow-hidden rounded-full`}
          style={{ border: '2px solid rgba(255,215,0,0.65)', boxShadow: '0 0 16px rgba(255,215,0,0.14)' }}
        >
          <AvatarImage src={champ.avatarUrl} alt={champ.username} width={56} height={56} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <div className="rounded-full border border-[rgba(255,215,0,0.18)] bg-[rgba(255,215,0,0.08)] px-2 py-1 text-[8px] font-mono tracking-[2px] text-[#FFD700]">
              CURRENT CHAMPION
            </div>
            {!compact ? (
              <div className="text-[8px] font-mono tracking-[2px] text-[rgba(255,255,255,0.4)]">
                HOLDS THE CUP
              </div>
            ) : null}
          </div>
          <div className={`truncate ${compact ? 'text-[18px]' : 'text-[20px]'} font-black text-white`}>@{champ.username}</div>
          <div className={`mt-1 ${compact ? 'text-[24px]' : 'text-[28px]'} font-mono font-black leading-none`} style={{ color: '#7FE17B' }}>
            {champ.pnl}
          </div>
        </div>
        <div className="text-right">
          <div className={`${compact ? 'text-[26px]' : 'text-[30px]'} font-black font-mono leading-none`} style={{ color: '#7FE17B' }}>
            {champ.stat}
          </div>
          <div className="mt-1 text-[8px] font-mono tracking-[2px] text-[rgba(255,255,255,0.45)]">
            OF FEES
          </div>
        </div>
      </div>
      {!compact ? (
        <div className="mt-4 border-t border-[rgba(255,255,255,0.08)] pt-3 text-[10px] font-mono tracking-[2px] text-[rgba(255,255,255,0.48)]">
          TOP 32 QUALIFY. GROUPS TO KNOCKOUTS. WINNER TAKES THE FEATURED SPOTLIGHT.
        </div>
      ) : null}
    </div>
  );
}

function ParticipationRail() {
  return (
    <div className="cut-sm p-[1px]" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.6), rgba(255,215,0,0.2))' }}>
      <div className="cut-sm flex flex-col gap-3 bg-[rgba(7,10,16,0.94)] p-4">
        <div className="text-[10px] font-mono tracking-[3px] text-[rgba(255,255,255,0.45)]">ENTER THE CUP</div>
        <div className="text-[22px] font-black leading-[1] text-white">Participate</div>
        <div className="text-[11px] font-mono tracking-[2px] text-[rgba(255,255,255,0.55)]">
          SIGN IN WITH X TO COMPETE
        </div>
        <ParticipateButton className="w-full justify-center" />
      </div>
    </div>
  );
}

function VariantOne() {
  return (
    <VariantFrame>
      <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <ChampionPlate />
          <ParticipationRail />
        </div>

        <div className="flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between gap-6">
            <div className="text-right">
              <SectionLabel>Season 1</SectionLabel>
              <div className="mt-3 text-[72px] font-black leading-[0.82] tracking-[-0.07em] text-white sm:text-[92px]">
                Trencher
              </div>
              <div className="text-[72px] font-black leading-[0.82] tracking-[-0.07em] sm:text-[92px]" style={{ color: '#59C8FF' }}>
                Cup
              </div>
            </div>
            <div className="relative h-[220px] w-[174px] shrink-0 sm:h-[280px] sm:w-[220px]">
              <Image src="/trencher-cup.png" alt="Trencher Cup" fill className="object-contain" priority />
            </div>
          </div>
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.08), rgba(255,255,255,0.22), rgba(0,212,255,0.08))' }} />
          <div className="grid gap-3 sm:grid-cols-3">
            {['Top 32 by 7D PnL', 'Top 2 in each group advance', 'Champion earns 69% of fees'].map((item) => (
              <div key={item} className="cut-xs px-3 py-3 text-[11px] font-mono tracking-[2px] text-[rgba(255,255,255,0.7)]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </VariantFrame>
  );
}

function VariantTwo() {
  return (
    <VariantFrame>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <ChampionPlate compact />

          <div className="flex flex-1 items-center justify-end gap-4 lg:pl-8">
            <div className="text-right">
              <SectionLabel>Season 1</SectionLabel>
              <div className="mt-2 text-[68px] font-black leading-[0.82] tracking-[-0.07em] text-white sm:text-[88px]">
                Trencher
              </div>
              <div className="text-[68px] font-black leading-[0.82] tracking-[-0.07em] sm:text-[88px]" style={{ color: '#59C8FF' }}>
                Cup
              </div>
            </div>
            <div className="relative h-[205px] w-[162px] shrink-0 sm:h-[255px] sm:w-[202px]">
              <Image src="/trencher-cup.png" alt="Trencher Cup" fill className="object-contain" priority />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div
            className="cut-sm grid gap-3 px-4 py-4 sm:grid-cols-3"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.015)',
            }}
          >
            {[
              { value: '32', label: 'TRADERS', note: 'QUALIFY BY 7D PNL', tone: '#ffffff' },
              { value: '4', label: 'GROUPS', note: 'TOP 2 ADVANCE', tone: '#59C8FF' },
              { value: '69%', label: 'CHAMPION', note: 'OF ALL FEES', tone: '#7FE17B' },
            ].map((item) => (
              <div
                key={item.label}
                className="cut-xs px-4 py-4"
                style={{
                  background: 'linear-gradient(180deg, rgba(7,10,16,0.92) 0%, rgba(7,10,16,0.72) 100%)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
                }}
              >
                <div className="text-[10px] font-mono tracking-[3px] text-[rgba(255,255,255,0.42)]">
                  {item.label}
                </div>
                <div
                  className="mt-2 text-[40px] font-black leading-none tracking-[-0.05em]"
                  style={{ color: item.tone, textShadow: item.tone === '#ffffff' ? '0 0 18px rgba(255,255,255,0.08)' : `0 0 24px ${item.tone}22` }}
                >
                  {item.value}
                </div>
                <div className="mt-3 text-[10px] font-mono tracking-[2px] text-[rgba(255,255,255,0.58)]">
                  {item.note}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-center gap-3">
            <div className="text-center text-[10px] font-mono tracking-[3px] text-[rgba(0,212,255,0.7)]">
              JOIN THE NEXT BRACKET
            </div>
            <ParticipateButton className="w-full justify-center" />
            <div className="text-center text-[10px] font-mono tracking-[2px] text-[rgba(255,255,255,0.42)]">
              SIGN IN. LINK WALLETS. CLIMB INTO THE CUP.
            </div>
          </div>
        </div>
      </div>
    </VariantFrame>
  );
}

function VariantThree() {
  return (
    <VariantFrame>
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <ParticipationRail />
          <div className="cut-sm px-4 py-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[9px] font-mono tracking-[3px] text-[rgba(0,212,255,0.72)]">FORMAT</div>
            <div className="mt-2 text-[13px] font-mono tracking-[2px] text-[rgba(255,255,255,0.76)]">32 traders. 4 groups. Knockouts. Champion spotlight.</div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-6">
            <ChampionPlate compact />
            <div className="relative hidden h-[220px] w-[174px] shrink-0 xl:block">
              <Image src="/trencher-cup.png" alt="Trencher Cup" fill className="object-contain" priority />
            </div>
          </div>
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(0,212,255,0.06), rgba(255,255,255,0.2), rgba(0,212,255,0.06))' }} />
          <div className="flex items-end justify-between gap-6">
            <div>
              <SectionLabel>Season 1</SectionLabel>
              <div className="mt-3 text-[72px] font-black leading-[0.82] tracking-[-0.07em] text-white sm:text-[96px]">
                Trencher
              </div>
              <div className="text-[72px] font-black leading-[0.82] tracking-[-0.07em] sm:text-[96px]" style={{ color: '#59C8FF' }}>
                Cup
              </div>
            </div>
            <div className="relative h-[205px] w-[162px] shrink-0 xl:hidden">
              <Image src="/trencher-cup.png" alt="Trencher Cup" fill className="object-contain" priority />
            </div>
          </div>
        </div>
      </div>
    </VariantFrame>
  );
}

export function CupHeroVariants() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050508] text-white">
      <BackgroundLayer />
      <div className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-8 px-6 py-12 sm:px-10">
        <div className="max-w-[820px]">
          <div className="text-[11px] font-mono tracking-[5px] uppercase text-[rgba(0,212,255,0.7)]">Cup Variants</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Trencher Cup Header Concepts</h1>
          <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-[rgba(255,255,255,0.62)]">
            Three directions for the cup hero. Each variant includes a winner highlight on the left side and a branded
            `Participate` CTA that routes into the Privy login flow.
          </p>
        </div>

        <div className="space-y-3">
          <SectionLabel>Variant A</SectionLabel>
          <VariantOne />
        </div>
        <div className="space-y-3">
          <SectionLabel>Variant B</SectionLabel>
          <VariantTwo />
        </div>
        <div className="space-y-3">
          <SectionLabel>Variant C</SectionLabel>
          <VariantThree />
        </div>
      </div>
    </div>
  );
}
