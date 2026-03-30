import Image from 'next/image';
import { Check } from 'lucide-react';

interface ProfileHeaderProps {
  avatarUrl?: string | null;
  displayName: string;
  username: string;
  bio?: string | null;
  verified?: boolean;
}

export function ProfileHeader({ avatarUrl, displayName, username, bio, verified }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4 p-6 pb-4">
      <div
        className="w-[72px] h-[72px] rounded-full flex-shrink-0 flex items-center justify-center text-[26px] font-bold text-black overflow-hidden"
        style={{
          background: avatarUrl ? undefined : 'var(--trench-accent)',
          boxShadow: '0 0 30px rgba(0,212,255,0.2), inset 0 0 20px rgba(0,212,255,0.05)',
          border: '2px solid rgba(0,212,255,0.3)',
        }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName} width={72} height={72} className="w-full h-full object-cover" unoptimized />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-[20px] text-white truncate">@{username}</h1>
        {bio && <p className="text-[12px] text-[var(--trench-text-muted)] mt-0.5 leading-snug">{bio}</p>}
        {verified && (
          <span
            className="inline-flex items-center gap-1 text-[9px] text-[var(--trench-accent)] px-2 py-0.5 mt-1.5 tracking-[1px] rounded-sm"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            <Check size={10} strokeWidth={3} />
            ON-CHAIN VERIFIED
          </span>
        )}
      </div>
    </div>
  );
}
