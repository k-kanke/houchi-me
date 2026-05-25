'use client';

import NowCard from '@/components/panel/NowCard';
import Timeline from '@/components/panel/Timeline';
import Stats from '@/components/panel/Stats';

export default function RightPanel() {
  return (
    <aside className="no-scrollbar flex h-full flex-col gap-3 overflow-y-auto p-3">
      <NowCard />
      <Timeline />
      <Stats />
    </aside>
  );
}
