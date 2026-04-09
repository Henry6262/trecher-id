'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries, type IChartApi } from 'lightweight-charts';

interface PnlDataPoint {
  time: string;
  value: number;
}

interface PnlHistoryResponse {
  source: 'exact_helius' | 'derived_aggregates' | 'unavailable';
  series: PnlDataPoint[];
}

export function PnlChart({ username }: { username: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [data, setData] = useState<PnlDataPoint[] | null>(null);
  const [source, setSource] = useState<PnlHistoryResponse['source']>('unavailable');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/pnl-history?username=${username}`)
      .then(r => r.json())
      .then((payload: PnlHistoryResponse) => {
        setData(payload.series);
        setSource(payload.source);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!containerRef.current || !data || data.length < 2) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 180,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#71717a',
        fontSize: 10,
        fontFamily: 'var(--font-geist-mono), monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
      },
      crosshair: {
        horzLine: { color: 'rgba(0,212,255,0.2)' },
        vertLine: { color: 'rgba(0,212,255,0.2)' },
      },
      handleScale: false,
      handleScroll: false,
    });

    const lastValue = data[data.length - 1]?.value ?? 0;
    const lineColor = lastValue >= 0 ? '#22c55e' : '#ef4444';
    const topColor = lastValue >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';

    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor,
      bottomColor: 'transparent',
      lineWidth: 2,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: lineColor,
    });

    series.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data]);

  if (loading) {
    return (
      <div className="h-[180px] flex items-center justify-center">
        <span className="text-[9px] tracking-[2px] text-[var(--trench-text-muted)] animate-pulse">LOADING CHART...</span>
      </div>
    );
  }

  if (!data || data.length < 2) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 text-[9px] text-[var(--trench-text-muted)] tracking-[2px] mb-3">
        PNL HISTORY
        <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
        <span className="font-mono text-[8px] text-[var(--trench-text-muted)]">
          {source === 'exact_helius' ? 'EXACT' : source === 'derived_aggregates' ? 'DERIVED' : 'UNAVAILABLE'}
        </span>
        <span className="font-mono text-[8px]">
          {data[data.length - 1].value >= 0 ? '+' : ''}{Math.round(data[data.length - 1].value)} SOL
        </span>
      </div>
      {source === 'exact_helius' && (
        <p className="mb-2 text-[9px] text-[var(--trench-text-muted)]">
          Built from recent indexed Helius swap events.
        </p>
      )}
      {source === 'derived_aggregates' && (
        <p className="mb-2 text-[9px] text-[var(--trench-text-muted)]">
          Reconstructed from indexed wallet aggregates because exact event history was unavailable.
        </p>
      )}
      <div
        ref={containerRef}
        className="cut-sm overflow-hidden border"
        style={{ background: 'rgba(8,12,22,0.4)', border: '1px solid rgba(0,212,255,0.06)' }}
      />
    </div>
  );
}
