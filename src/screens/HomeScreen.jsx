import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ExperienceCard from '../components/ExperienceCard.jsx';
import ExperienceModal from '../components/ExperienceModal.jsx';

export default function HomeScreen({
  experiences = [],
  reservedIds = new Set(),
  onReserve = () => {},
}) {
  const containerRef = useRef(null);
  const [openExperience, setOpenExperience] = useState(null);
  const [justReservedId, setJustReservedId] = useState(null);
  const [feedTab, setFeedTab] = useState('recommend');

  const handleDetail = (exp) => {
    setJustReservedId(null);
    setOpenExperience(exp);
  };

  const handleQuickReserve = (exp) => {
    // 「予約する」直接タップ → モーダルを開き、完了状態として表示
    setJustReservedId(exp.id);
    setOpenExperience(exp);
    onReserve(exp);
  };

  const handleModalReserve = (exp) => {
    onReserve(exp);
  };

  const handleClose = () => {
    setOpenExperience(null);
    setJustReservedId(null);
  };

  const isOpenAlready =
    openExperience &&
    (reservedIds.has(openExperience.id) || justReservedId === openExperience.id);

  return (
    <div className="relative w-full h-full bg-black">
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-y-auto feed-snap no-scrollbar bg-black"
      >
        {experiences.map((exp) => (
          <ExperienceCard
            key={exp.id}
            experience={exp}
            reserved={reservedIds.has(exp.id)}
            onDetail={() => handleDetail(exp)}
            onReserve={() => handleQuickReserve(exp)}
          />
        ))}
      </div>

      {/* 上部グラデーション（ヘッダーの視認性確保） */}
      <div className="absolute top-0 left-0 right-0 h-24 z-20 pointer-events-none bg-gradient-to-b from-black/50 to-transparent" />

      {/* TikTok 風 トップピルヘッダー */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-10 pb-3 px-4 flex items-center justify-center gap-6 pointer-events-auto">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => setFeedTab('follow')}
          className="relative cursor-pointer"
        >
          <span
            className={`text-[15px] font-bold tracking-wide ${
              feedTab === 'follow' ? 'text-white' : 'text-white/55'
            }`}
          >
            フォロー中
          </span>
          {feedTab === 'follow' && (
            <motion.span
              layoutId="feed-tab"
              className="absolute left-1/2 -translate-x-1/2 mt-1 h-[3px] w-5 bg-white rounded-full"
            />
          )}
        </motion.button>

        <span className="text-white/30 text-xs">|</span>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => setFeedTab('recommend')}
          className="relative cursor-pointer"
        >
          <span
            className={`text-[15px] font-bold tracking-wide ${
              feedTab === 'recommend' ? 'text-white' : 'text-white/55'
            }`}
          >
            おすすめ
          </span>
          {feedTab === 'recommend' && (
            <motion.span
              layoutId="feed-tab"
              className="absolute left-1/2 -translate-x-1/2 mt-1 h-[3px] w-5 bg-white rounded-full"
            />
          )}
        </motion.button>
      </div>

      {/* 右上：検索アイコン */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => {}}
        className="absolute top-10 right-4 z-30 text-white/90 text-xl cursor-pointer"
        aria-label="検索"
      >
        🔍
      </motion.button>

      {/* 詳細／予約完了モーダル */}
      <ExperienceModal
        experience={openExperience}
        open={!!openExperience}
        onClose={handleClose}
        onReserve={handleModalReserve}
        alreadyReserved={isOpenAlready}
      />
    </div>
  );
}
