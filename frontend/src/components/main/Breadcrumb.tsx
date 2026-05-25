'use client';

import { useAppStore } from '@/lib/store';

export default function Breadcrumb() {
  const tab = useAppStore((s) => s.viewTab);
  const label =
    tab === 'world' ? 'メインフロア' : tab === 'note' ? '今日のTopic' : '対話';
  return (
    <div className="flex items-center gap-2 text-[11.5px] text-white/55">
      <span>叡智の図書館</span>
      <span className="text-white/25">/</span>
      <span>ナレッジベース</span>
      <span className="text-white/25">/</span>
      <span className="text-white">{label}</span>
    </div>
  );
}
