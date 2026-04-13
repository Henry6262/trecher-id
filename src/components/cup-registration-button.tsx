'use client';

import { useEffect, useState } from 'react';
import { CutButton } from '@/components/cut-button';
import { Check, AlertCircle, Trophy } from 'lucide-react';

interface RegistrationStatus {
  registered: boolean;
  eligible?: boolean;
  status?: string;
  rank?: number | null;
  group?: string | null;
  totalTrades?: number;
  pnlUsd?: number;
  pnlSol?: number;
  walletCount?: number;
  minTradesRequired?: number;
  message: string;
}

export function CupRegistrationButton() {
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/cup/register')
      .then((r) => r.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to check registration status');
        setLoading(false);
      });
  }, []);

  const handleRegister = async () => {
    setRegistering(true);
    setError('');

    try {
      const res = await fetch('/api/cup/register', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setStatus({ registered: true, message: data.message });
      } else {
        setError(data.message || data.error);
      }
    } catch {
      setError('Failed to register. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-[11px] font-mono text-[var(--trench-text-muted)] animate-pulse">
          Checking eligibility...
        </span>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] text-red-400">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!status) return null;

  // Already registered
  if (status.registered && status.status) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy size={16} style={{ color: '#FFD700' }} />
          <span className="text-[13px] font-bold text-white">{status.message}</span>
        </div>
        {status.rank && (
          <div className="text-[10px] font-mono text-[var(--trench-text-muted)]">
            Seed #{status.rank}{status.group ? ` • Group ${status.group}` : ''}
          </div>
        )}
      </div>
    );
  }

  // Eligible but not registered
  if (status.eligible) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Check size={14} style={{ color: '#22c55e' }} />
          <span className="text-[12px] text-[var(--trench-text)]">{status.message}</span>
        </div>
        <CutButton
          onClick={handleRegister}
          disabled={registering}
          size="sm"
        >
          {registering ? 'Registering...' : 'Register for Season 1'}
        </CutButton>
      </div>
    );
  }

  // Not yet eligible
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <AlertCircle size={14} style={{ color: '#f59e0b' }} />
        <span className="text-[12px] text-[var(--trench-text)]">{status.message}</span>
      </div>
      <div className="text-[10px] font-mono text-[var(--trench-text-muted)]">
        {status.totalTrades ?? 0} / {status.minTradesRequired ?? 10} trades
        {status.walletCount === 0 && ' • Link a wallet in your dashboard'}
      </div>
    </div>
  );
}
