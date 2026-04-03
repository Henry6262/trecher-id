export interface RankedTrader {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isClaimed?: boolean;
  pnlUsd: number;
  pnlSol: number;
  winRate: number;
  trades: number;
}

export interface Group {
  name: string; // "A" through "H"
  traders: RankedTrader[];
}

export interface Matchup {
  id: string;
  round: 'R16' | 'QF' | 'SF' | 'FINAL';
  trader1: RankedTrader | null;
  trader2: RankedTrader | null;
  winner: RankedTrader | null;
}

export interface BracketData {
  groups: Group[];
  knockoutRounds: { r16: Matchup[]; qf: Matchup[]; sf: Matchup[]; final: Matchup[] };
  champion: RankedTrader | null;
}

const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Serpentine seeding into 8 groups of 4.
 * Seeds 1-8:   A B C D E F G H  (forward)
 * Seeds 9-16:  H G F E D C B A  (reverse)
 * Seeds 17-24: A B C D E F G H  (forward)
 * Seeds 25-32: H G F E D C B A  (reverse)
 */
export function seedGroups(traders: RankedTrader[]): Group[] {
  const groups: Group[][] = Array.from({ length: 8 }, () => []);

  const sorted = [...traders].sort((a, b) => b.pnlUsd - a.pnlUsd).slice(0, 32);

  for (let i = 0; i < 32; i++) {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const groupIdx = row % 2 === 0 ? col : 7 - col;
    groups[groupIdx].push(sorted[i]);
  }

  return groups.map((traders, i) => ({
    name: GROUP_NAMES[i],
    traders: [...traders].sort((a, b) => b.pnlUsd - a.pnlUsd),
  }));
}

/**
 * Resolve a matchup: higher pnlUsd wins.
 * Ties: winRate -> trades -> rank (lower rank = better).
 */
export function resolveMatchup(t1: RankedTrader, t2: RankedTrader): RankedTrader {
  if (t1.pnlUsd !== t2.pnlUsd) return t1.pnlUsd > t2.pnlUsd ? t1 : t2;
  if (t1.winRate !== t2.winRate) return t1.winRate > t2.winRate ? t1 : t2;
  if (t1.trades !== t2.trades) return t1.trades > t2.trades ? t1 : t2;
  return t1.rank < t2.rank ? t1 : t2;
}

/**
 * Build the full bracket from 32 traders.
 * Seeds groups, determines top 2 per group, builds R16 -> QF -> SF -> Final.
 */
export function buildBracket(traders: RankedTrader[]): BracketData {
  const groups = seedGroups(traders);

  // Top 2 per group (already sorted by pnlUsd within each group)
  const firsts = groups.map((g) => g.traders[0]);
  const seconds = groups.map((g) => g.traders[1]);

  // R16 matchups:
  // R16-1: 1stA vs 2ndB, R16-2: 1stC vs 2ndD, R16-3: 1stE vs 2ndF, R16-4: 1stG vs 2ndH
  // R16-5: 1stB vs 2ndA, R16-6: 1stD vs 2ndC, R16-7: 1stF vs 2ndE, R16-8: 1stH vs 2ndG
  const r16Pairs: [number, number][] = [
    [0, 1], [2, 3], [4, 5], [6, 7], // 1stA vs 2ndB, 1stC vs 2ndD, etc.
    [1, 0], [3, 2], [5, 4], [7, 6], // 1stB vs 2ndA, 1stD vs 2ndC, etc.
  ];

  const r16: Matchup[] = r16Pairs.map(([firstIdx, secondIdx], i) => {
    const t1 = firsts[firstIdx];
    const t2 = seconds[secondIdx];
    return {
      id: `R16-${i + 1}`,
      round: 'R16' as const,
      trader1: t1,
      trader2: t2,
      winner: resolveMatchup(t1, t2),
    };
  });

  // QF: R16-1 vs R16-2, R16-3 vs R16-4, R16-5 vs R16-6, R16-7 vs R16-8
  const qf: Matchup[] = [];
  for (let i = 0; i < 4; i++) {
    const t1 = r16[i * 2].winner!;
    const t2 = r16[i * 2 + 1].winner!;
    qf.push({
      id: `QF-${i + 1}`,
      round: 'QF',
      trader1: t1,
      trader2: t2,
      winner: resolveMatchup(t1, t2),
    });
  }

  // SF: QF-1 vs QF-2, QF-3 vs QF-4
  const sf: Matchup[] = [];
  for (let i = 0; i < 2; i++) {
    const t1 = qf[i * 2].winner!;
    const t2 = qf[i * 2 + 1].winner!;
    sf.push({
      id: `SF-${i + 1}`,
      round: 'SF',
      trader1: t1,
      trader2: t2,
      winner: resolveMatchup(t1, t2),
    });
  }

  // Final
  const finalMatchup: Matchup = {
    id: 'FINAL',
    round: 'FINAL',
    trader1: sf[0].winner!,
    trader2: sf[1].winner!,
    winner: resolveMatchup(sf[0].winner!, sf[1].winner!),
  };

  return {
    groups,
    knockoutRounds: { r16, qf, sf, final: [finalMatchup] },
    champion: finalMatchup.winner,
  };
}
