import { notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { ProfileCard } from '@/components/profile-card';
import { BackgroundLayer } from '@/components/background-layer';
import type { Metadata } from 'next';
import { buildProfileMetadata, getPublicProfileData } from '@/lib/profile';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfileData(username);
  if (!profile) return { title: 'Not Found' };
  return buildProfileMetadata(profile);
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfileData(username);
  if (!profile) notFound();

  const session = await getSessionUser();
  const isOwner = !!(session && session.username === profile.user.username);

  return (
    <div className="min-h-screen relative" style={{ background: 'transparent' }}>
      <BackgroundLayer />
      <div className="relative py-10 px-4" style={{ zIndex: 1 }}>
        <ProfileCard
          user={profile.user}
          accentColor={profile.accentColor}
          bannerUrl={profile.bannerUrl}
          followerCount={profile.followerCount}
          stats={profile.stats}
          links={profile.links}
          pinnedTrades={profile.pinnedTrades}
          traderStats={profile.traderStats}
          wallets={profile.wallets}
          deployments={profile.deployments}
          allTrades={profile.allTrades}
          degenScore={profile.degenScore}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
