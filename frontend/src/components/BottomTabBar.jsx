import { motion } from 'framer-motion';

function HomeIcon({ active }) {
  const color = active ? '#ffffff' : '#a1a1a1';
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
    >
      <path d="M12 3.172 2.5 11.05a.75.75 0 0 0 .956 1.155L4 11.82V20a1 1 0 0 0 1 1h4.5a.5.5 0 0 0 .5-.5V15a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5.5a.5.5 0 0 0 .5.5H19a1 1 0 0 0 1-1v-8.18l.544.385A.75.75 0 0 0 21.5 11.05L12 3.172Z" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  const color = active ? '#ffffff' : '#a1a1a1';
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
    >
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 1.75c-3.728 0-8.25 1.872-8.25 5.5V21a.5.5 0 0 0 .5.5h15.5a.5.5 0 0 0 .5-.5v-1.75c0-3.628-4.522-5.5-8.25-5.5Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function BottomTabBar({ active = 'home', onChange }) {
  const handle = (tab) => {
    if (onChange) onChange(tab);
  };

  const isPostActive = active === 'post';

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-30 bg-black border-t border-white/5 pb-2"
      role="navigation"
    >
      <div className="h-14 flex items-center justify-around px-4">
        {/* Home */}
        <motion.button
          type="button"
          aria-label="ホーム"
          onClick={() => handle('home')}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-0.5 cursor-pointer select-none bg-transparent border-0 p-0"
        >
          <HomeIcon active={active === 'home'} />
          <span
            className={`text-[10px] font-bold tracking-tight ${
              active === 'home' ? 'text-white' : 'text-[#a1a1a1]'
            }`}
          >
            ホーム
          </span>
        </motion.button>

        {/* Post (center +) */}
        <motion.button
          type="button"
          aria-label="投稿"
          onClick={() => handle('post')}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className={`relative w-12 h-8 flex items-center justify-center cursor-pointer select-none bg-transparent border-0 p-0 ${
            isPostActive
              ? 'drop-shadow-[0_0_18px_rgba(255,92,0,0.45)]'
              : ''
          }`}
        >
          {/* Teal layer (back-left) */}
          <span
            className="absolute inset-0 -translate-x-1 rounded-[10px] bg-[#25F4EE]"
            aria-hidden="true"
          />
          {/* Pink layer (back-right) */}
          <span
            className="absolute inset-0 translate-x-1 rounded-[10px] bg-[#FE2C55]"
            aria-hidden="true"
          />
          {/* White front */}
          <span
            className="absolute inset-0 rounded-[10px] bg-white flex items-center justify-center"
            aria-hidden="true"
          >
            <PlusIcon />
          </span>
        </motion.button>

        {/* Profile */}
        <motion.button
          type="button"
          aria-label="プロフィール"
          onClick={() => handle('profile')}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center gap-0.5 cursor-pointer select-none bg-transparent border-0 p-0"
        >
          <ProfileIcon active={active === 'profile'} />
          <span
            className={`text-[10px] font-bold tracking-tight ${
              active === 'profile' ? 'text-white' : 'text-[#a1a1a1]'
            }`}
          >
            プロフィール
          </span>
        </motion.button>
      </div>
    </nav>
  );
}
