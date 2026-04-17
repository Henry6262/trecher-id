import { notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { ProfileCard } from '@/components/profile-card';
import type { Metadata } from 'next';
import { buildProfileMetadata, getPublicProfileData } from '@/lib/profile';
import { SynapticBackgroundLayer } from '@/components/synaptic-background-layer';
import { BackButton } from '@/components/back-button';
import { TradingAnalyticsPanel } from '@/components/dashboard/trading-analytics-panel';

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
      <SynapticBackgroundLayer />
      <div className="relative py-10 px-4" style={{ zIndex: 1 }}>
        <div className="mx-auto max-w-2xl mb-4">
          <BackButton />
        </div>
        <ProfileCard
          user={profile.user}
          accentColor={profile.accentColor}
          bannerUrl={profile.bannerUrl}
          followerCount={profile.followerCount}
          stats={profile.stats}
          leaderboard={profile.leaderboard}
          dataProvenance={profile.dataProvenance}
          links={profile.links}
          pinnedTrades={profile.pinnedTrades}
          traderStats={profile.traderStats}
          wallets={profile.wallets}
          deployments={profile.deployments}
          deployerSnapshot={profile.deployerSnapshot}
          allTrades={profile.allTrades}
          degenScore={profile.degenScore}
          isOwner={isOwner}
        />
        <div className="mx-auto max-w-2xl mt-6">
          <TradingAnalyticsPanel username={profile.user.username} />
        </div>
      </div>
    </div>
  );
}
