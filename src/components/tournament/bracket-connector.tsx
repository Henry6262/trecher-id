'use client';

export function BracketConnector({
  matchups,
  rowHeight,
  gap,
  delay = 0,
}: {
  matchups: number;
  rowHeight: number;
  gap: number;
  delay?: number;
}) {
  const pairs = matchups / 2;
  const totalHeight = matchups * rowHeight + (matchups - 1) * gap;
  const width = 52;

  const paths: string[] = [];

  for (let i = 0; i < pairs; i++) {
    const topIdx = i * 2;
    const bottomIdx = i * 2 + 1;

    // Center Y of each source matchup
    const topY = topIdx * (rowHeight + gap) + rowHeight / 2;
    const bottomY = bottomIdx * (rowHeight + gap) + rowHeight / 2;

    // Center Y of destination matchup
    const destY = (topY + bottomY) / 2;

    // Horizontal from left -> midpoint, vertical bar, horizontal to right
    const midX = width / 2;

    paths.push(`M 0 ${topY} H ${midX}`);
    paths.push(`M 0 ${bottomY} H ${midX}`);
    paths.push(`M ${midX} ${topY} V ${bottomY}`);
    paths.push(`M ${midX} ${destY} H ${width}`);
  }

  return (
    <svg
      width={width}
      height={totalHeight}
      className="flex-shrink-0"
      style={{ minWidth: width }}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="rgba(0,212,255,0.25)"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}
