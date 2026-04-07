import { DeploymentCard } from './deployment-card';

export interface DeploymentData {
  id: string;
  tokenSymbol: string;
  tokenName?: string | null;
  tokenImageUrl?: string | null;
  platform: string;
  status: string;
  mcapAthUsd?: number | null;
  holders?: number | null;
  volumeUsd?: number | null;
  devPnlSol?: number | null;
  devPnlUsd?: number | null;
  deployedAt: string;
}

interface DeploymentCarouselProps {
  deployments: DeploymentData[];
}

export function DeploymentCarousel({ deployments }: DeploymentCarouselProps) {
  if (deployments.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 text-[9px] text-[var(--trench-text-muted)] tracking-[2px] mb-3">
        TOKEN DEPLOYMENTS
        <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.08)' }} />
        <span className="font-mono text-[8px] text-[var(--trench-text-muted)]">
          {deployments.length} TOKENS
        </span>
      </div>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto no-scrollbar px-1 pb-1 snap-x snap-mandatory">
        {deployments.map((dep) => (
          <DeploymentCard
            key={dep.id}
            tokenSymbol={dep.tokenSymbol}
            tokenName={dep.tokenName}
            tokenImageUrl={dep.tokenImageUrl}
            platform={dep.platform}
            status={dep.status}
            mcapAthUsd={dep.mcapAthUsd}
            holders={dep.holders}
            volumeUsd={dep.volumeUsd}
            devPnlSol={dep.devPnlSol}
            devPnlUsd={dep.devPnlUsd}
            deployedAt={dep.deployedAt}
          />
        ))}
      </div>
    </div>
  );
}
