'use client';

import { GroupCard } from './group-card';
import type { Group } from './bracket-utils';

export function GroupStage({ groups }: { groups: Group[] }) {
  return (
    <div>
      <div className="text-[11px] font-mono tracking-[2px] text-[var(--trench-text-muted)] mb-4">
        GROUP STAGE
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {groups.map((group) => (
          <GroupCard key={group.name} group={group} />
        ))}
      </div>
    </div>
  );
}
