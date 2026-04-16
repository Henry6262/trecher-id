'use client';

import { GlassCard } from '@/components/glass-card';
import Image from 'next/image';

interface TradeEvent {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  tokenImageUrl: string | null;
  type: 'buy' | 'sell';
  amountSol: number;
  timestamp: Date;
}

export function RecentTrades({ trades, limit = 10 }: { trades: TradeEvent[]; limit?: number }) {
  const recentTrades = trades.slice(0, limit);

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Token</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">Amount (SOL)</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {recentTrades.length > 0 ? (
              recentTrades.map((trade) => (
                <tr
                  key={trade.id}
                  className="border-b border-gray-800/50 hover:bg-gray-700/20 transition"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {trade.tokenImageUrl && (
                        <Image
                          src={trade.tokenImageUrl}
                          alt={trade.tokenSymbol}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-white">{trade.tokenSymbol}</p>
                        <p className="text-xs text-gray-500">{trade.tokenName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.type === 'buy'
                          ? 'bg-green-600/30 text-green-300'
                          : 'bg-red-600/30 text-red-300'
                      }`}
                    >
                      {trade.type === 'buy' ? '↓ BUY' : '↑ SELL'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-white font-medium">
                    {trade.amountSol.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {new Date(trade.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 px-4 text-center text-gray-500">
                  No trades yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
