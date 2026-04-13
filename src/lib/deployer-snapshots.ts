import type { DuneDeployer } from './dune';

const SOLANA_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export type SnapshotValidationStatus = 'valid' | 'warning' | 'invalid';

export interface ValidatedDeployerSnapshot {
  walletAddress: string;
  totalDeployed: number;
  totalMigrated: number;
  graduationRate: number;
  tokens7d: number;
  tokens30d: number;
  validationStatus: SnapshotValidationStatus;
  validationReason: string | null;
  rawPayload: DuneDeployer;
}

export interface InvalidDeployerSnapshot {
  walletAddress: string | null;
  reason: string;
  rawPayload: DuneDeployer;
}

function clampInt(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

function normalizeGraduationRate(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  const normalized = rate <= 1 ? rate * 100 : rate;
  return Math.max(0, Math.min(100, normalized));
}

function mergeValidationReason(parts: string[]): string | null {
  return parts.length > 0 ? parts.join('; ') : null;
}

export function buildUnclaimedDeployerIdentity(walletAddress: string) {
  return {
    username: `deployer_${walletAddress}`,
    displayName: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
  };
}

export function buildDeployerBio(snapshot: Pick<ValidatedDeployerSnapshot, 'totalMigrated' | 'totalDeployed' | 'tokens7d'>): string {
  return `Top memecoin deployer — ${snapshot.totalMigrated} migrated, ${snapshot.totalDeployed} total deployed, ${snapshot.tokens7d} launched in the last 7d`;
}

export function validateAndNormalizeDeployers(rows: DuneDeployer[]): {
  valid: ValidatedDeployerSnapshot[];
  invalid: InvalidDeployerSnapshot[];
} {
  const validByWallet = new Map<string, ValidatedDeployerSnapshot>();
  const invalid: InvalidDeployerSnapshot[] = [];

  for (const row of rows) {
    const walletAddress = row.deployer_wallet?.trim() || null;
    if (!walletAddress || !SOLANA_ADDRESS_PATTERN.test(walletAddress)) {
      invalid.push({
        walletAddress,
        reason: 'invalid_wallet_address',
        rawPayload: row,
      });
      continue;
    }

    const totalDeployed = clampInt(Number(row.total_deployed));
    const totalMigratedRaw = clampInt(Number(row.total_migrated));
    const tokens7dRaw = clampInt(Number(row.tokens_7d));
    const tokens30dRaw = clampInt(Number(row.tokens_30d));
    const graduationRateRaw = normalizeGraduationRate(Number(row.graduation_rate));
    const warnings: string[] = [];

    if (totalDeployed <= 0) {
      invalid.push({
        walletAddress,
        reason: 'non_positive_total_deployed',
        rawPayload: row,
      });
      continue;
    }

    const totalMigrated = Math.min(totalMigratedRaw, totalDeployed);
    if (totalMigratedRaw > totalDeployed) {
      warnings.push('migrations_exceeded_total_deployed');
    }

    const tokens7d = Math.min(tokens7dRaw, totalDeployed);
    if (tokens7dRaw > totalDeployed) {
      warnings.push('tokens_7d_exceeded_total_deployed');
    }

    const tokens30d = Math.min(tokens30dRaw, totalDeployed);
    if (tokens30dRaw > totalDeployed) {
      warnings.push('tokens_30d_exceeded_total_deployed');
    }

    if (tokens7d > tokens30d && tokens30d > 0) {
      warnings.push('tokens_7d_exceeded_tokens_30d');
    }

    const snapshot: ValidatedDeployerSnapshot = {
      walletAddress,
      totalDeployed,
      totalMigrated,
      graduationRate: graduationRateRaw,
      tokens7d,
      tokens30d,
      validationStatus: warnings.length > 0 ? 'warning' : 'valid',
      validationReason: mergeValidationReason(warnings),
      rawPayload: row,
    };

    const existing = validByWallet.get(walletAddress);
    if (!existing) {
      validByWallet.set(walletAddress, snapshot);
      continue;
    }

    const shouldReplace =
      snapshot.totalMigrated > existing.totalMigrated ||
      (snapshot.totalMigrated === existing.totalMigrated && snapshot.tokens7d > existing.tokens7d) ||
      (snapshot.totalMigrated === existing.totalMigrated && snapshot.tokens7d === existing.tokens7d && snapshot.totalDeployed > existing.totalDeployed);

    if (shouldReplace) {
      validByWallet.set(walletAddress, snapshot);
    }
  }

  return {
    valid: Array.from(validByWallet.values()),
    invalid,
  };
}

export function reconcileSnapshotValidation(
  snapshot: ValidatedDeployerSnapshot,
  localDeploymentCount: number,
): Pick<ValidatedDeployerSnapshot, 'validationStatus' | 'validationReason'> {
  const warnings = snapshot.validationReason ? snapshot.validationReason.split('; ').filter(Boolean) : [];

  if (snapshot.totalDeployed >= 3 && localDeploymentCount === 0) {
    warnings.push('local_token_deployments_missing');
  } else if (localDeploymentCount > snapshot.totalDeployed + 5) {
    warnings.push('local_deployments_exceed_dune_snapshot');
  }

  return {
    validationStatus: warnings.length > 0 ? 'warning' : 'valid',
    validationReason: mergeValidationReason(warnings),
  };
}
