'use client';

import TopBarNav from './TopBarNav';

export default function TopBar() {
  return (
    <header
      className="relative z-20 hidden h-[72px] shrink-0 items-center justify-center border-b border-white/[0.05] px-3 sm:px-4 lg:flex"
      style={{
        background: 'rgba(10, 8, 32, 0.32)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      }}
    >
      <TopBarNav />
    </header>
  );
}
