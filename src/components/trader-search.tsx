'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function TraderSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const username = query.trim().replace('@', '');
    if (username) router.push(`/${username}`);
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md mx-auto">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--trench-text-muted)]" />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search @username..."
        className="w-full pl-10 pr-4 py-2.5 bg-transparent font-mono text-sm text-[var(--trench-text)] placeholder:text-[var(--trench-text-muted)] outline-none transition-colors"
        style={{
          background: 'rgba(0,212,255,0.03)',
          border: '1px solid rgba(0,212,255,0.1)',
          borderRadius: '6px',
        }}
      />
    </form>
  );
}
