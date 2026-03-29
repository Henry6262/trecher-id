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
    <div className="flex items-center gap-[18px] p-6">
      <div
        className="w-[72px] h-[72px] rounded-full flex-shrink-0 flex items-center justify-center text-[26px] font-bold text-black overflow-hidden"
        style={{
          background: avatarUrl ? undefined : 'var(--trench-orange)',
          boxShadow: 'var(--trench-glow)',
          border: '2px solid rgba(255,107,0,0.25)',
        }}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName} width={72} height={72} className="w-full h-full object-cover" />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-[20px] text-[var(--trench-text)] truncate">@{username}</h1>
        {bio && <p className="text-[13px] text-[var(--trench-text-muted)] mt-0.5 leading-snug">{bio}</p>}
        {verified && (
          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--trench-orange)] bg-[rgba(255,107,0,0.1)] px-2 py-0.5 mt-1.5 tracking-wide cut-xs">
            <Check size={10} strokeWidth={3} />
            ON-CHAIN VERIFIED
          </span>
        )}
      </div>
    </div>
  );
}
