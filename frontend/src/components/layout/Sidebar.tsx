'use client';

import CloneStatusCard from '@/components/sidebar/CloneStatusCard';
import Vitals from '@/components/sidebar/Vitals';
import NavTree from '@/components/sidebar/NavTree';
import MiniMap from '@/components/sidebar/MiniMap';

export default function Sidebar() {
  return (
    <aside className="no-scrollbar flex h-full flex-col gap-3 overflow-y-auto p-3">
      <CloneStatusCard />
      <Vitals />
      <NavTree />
      <MiniMap />
    </aside>
  );
}
