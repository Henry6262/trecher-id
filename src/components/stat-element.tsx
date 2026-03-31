interface StatElementProps {
  label: string;
  value: string;
  color?: 'green' | 'cyan' | 'white' | 'red';
  size?: 'sm' | 'md';
}

const COLOR_MAP: Record<NonNullable<StatElementProps['color']>, string> = {
  green: 'text-[var(--trench-green)]',
  red: 'text-[var(--trench-red)]',
  cyan: 'text-[var(--trench-accent)]',
  white: 'text-[var(--trench-text)]',
};

const SIZE_MAP: Record<NonNullable<StatElementProps['size']>, { value: string; label: string }> = {
  sm: { value: 'text-sm', label: 'text-[7px]' },
  md: { value: 'text-lg', label: 'text-[8px]' },
};

export function StatElement({ label, value, color = 'cyan', size = 'md' }: StatElementProps) {
  const s = SIZE_MAP[size];

  return (
    <div
      className="cut-xs text-center py-3 px-2"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(0,212,255,0.08)',
      }}
    >
      <div className={`font-bold font-mono ${s.value} ${COLOR_MAP[color]}`}>
        {value}
      </div>
      <div className={`${s.label} text-[var(--trench-text-muted)] tracking-[1.5px] uppercase mt-0.5`}>
        {label}
      </div>
    </div>
  );
}
