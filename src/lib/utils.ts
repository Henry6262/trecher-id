import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function formatPnl(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${prefix}$${Math.round(value / 1_000_000)}M`;
  }
  if (abs >= 1000) {
    return `${prefix}$${Math.round(value / 1000)}K`;
  }
  return `${prefix}$${Math.round(value)}`;
}

export function formatPnlFull(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${Math.round(Math.abs(value)).toLocaleString()}`;
}

export function formatPercent(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(0)}%`;
}
