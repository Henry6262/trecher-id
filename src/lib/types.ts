/** Shared types used across server and client boundaries.
 *  Keep this file free of any runtime imports to avoid
 *  Turbopack module-graph conflicts between server/client. */

export interface TickerItem {
  username: string;
  avatarUrl: string | null;
  tokenSymbol: string;
  pnlPercent: number;
  totalPnlSol: number;
  pinnedAt: string; // ISO string
}
