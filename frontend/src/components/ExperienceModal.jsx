import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Badge from './Badge.jsx';
import Button from './Button.jsx';
import { getGenreVisual } from '../styles/tokens.js';

export default function ExperienceModal({
  experience,
  open,
  onClose,
  onReserve,
  alreadyReserved = false,
}) {
  const [completed, setCompleted] = useState(false);

  // モーダルを開いた瞬間 / 別の体験に切り替わったとき、完了状態をリセット or 同期
  useEffect(() => {
    if (open) {
      setCompleted(!!alreadyReserved);
    } else {
      // 閉じた後にチラ見せされないよう、アニメ後にリセット
      const t = setTimeout(() => setCompleted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open, alreadyReserved, experience?.id]);

  const handleReserve = () => {
    if (experience && onReserve) onReserve(experience);
    setCompleted(true);
  };

  const visual = experience ? getGenreVisual(experience.genre) : null;
  const remaining = experience
    ? experience.capacity - experience.reservedCount
    : 0;

  return (
    <AnimatePresence>
      {open && experience && (
        <>
          {/* バックドロップ */}
          <motion.div
            key="backdrop"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* シート */}
          <motion.div
            key="sheet"
            className="absolute bottom-0 left-0 right-0 bg-bg-elevated rounded-t-3xl z-50 max-h-[85%] overflow-y-auto no-scrollbar"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* ドラッグハンドル */}
            <div className="w-12 h-1.5 rounded-full bg-text-muted mx-auto mt-3 mb-4" />

            <AnimatePresence mode="wait">
              {!completed ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-8"
                >
                  {/* ジャンルヘッダー：絵文字＋グラデの帯 */}
                  <div
                    className="relative rounded-2xl overflow-hidden h-32 mb-5 flex items-center justify-center"
                    style={{ background: visual.gradient }}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="text-7xl relative drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                      {visual.emoji}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge tone="soft" size="md">#{experience.genre}</Badge>
                    {experience.isFirstTimeFree && (
                      <Badge tone="success" size="md">初回無料</Badge>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold mb-3 text-text-primary leading-tight">
                    {experience.title}
                  </h2>

                  {/* 詳細リスト */}
                  <div className="flex flex-col gap-3 mb-5">
                    <div className="flex items-center gap-3 text-sm text-text-primary">
                      <span className="w-5">📅</span>
                      <span className="text-text-secondary">開催日時</span>
                      <span className="ml-auto font-medium">{experience.startTime}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-text-primary">
                      <span className="w-5">📍</span>
                      <span className="text-text-secondary">開催場所</span>
                      <span className="ml-auto font-medium">{experience.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-text-primary">
                      <span className="w-5">⏱</span>
                      <span className="text-text-secondary">所要時間</span>
                      <span className="ml-auto font-medium">{experience.duration}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-text-primary">
                      <span className="w-5">💰</span>
                      <span className="text-text-secondary">参加費</span>
                      <span className="ml-auto font-medium">{experience.price}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-text-primary">
                      <span className="w-5">👥</span>
                      <span className="text-text-secondary">定員</span>
                      <span className="ml-auto font-medium">
                        {experience.capacity}人 /{' '}
                        <span className="text-accent">残り {remaining} 席</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-text-primary">
                      <span className="w-5">⭐</span>
                      <span className="text-text-secondary">獲得ポイント</span>
                      <span className="ml-auto font-bold text-accent">
                        +{experience.pointReward}pt
                      </span>
                    </div>
                  </div>

                  {/* バッジ群 */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {experience.isBeginnerFriendly && (
                      <Badge tone="soft">初心者歓迎</Badge>
                    )}
                    {experience.isFriendOk && (
                      <Badge tone="outline">友達参加OK</Badge>
                    )}
                    {experience.isFirstTimeFree && (
                      <Badge tone="success">初回無料</Badge>
                    )}
                  </div>

                  {/* 説明 */}
                  <p className="text-sm text-text-secondary leading-relaxed mb-5">
                    {experience.description}
                  </p>

                  {/* クリエイター */}
                  <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-bg-secondary">
                    <div className="text-3xl">{experience.creatorAvatar}</div>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-text-primary">
                        {experience.creator}
                      </span>
                      <span className="text-xs text-text-muted">ホスト</span>
                    </div>
                  </div>

                  <div className="border-t border-line pt-5">
                    {alreadyReserved ? (
                      <Button variant="primary" size="lg" fullWidth disabled>
                        予約済み
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleReserve}
                      >
                        予約する
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-8 pt-4 flex flex-col items-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                    className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center mb-5 shadow-glow"
                  >
                    <motion.span
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                      className="text-5xl"
                    >
                      ✅
                    </motion.span>
                  </motion.div>

                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    予約が完了しました
                  </h2>

                  <div className="w-full bg-bg-secondary rounded-2xl p-4 my-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge tone="soft" size="sm">#{experience.genre}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-text-primary mb-2 leading-snug">
                      {experience.title}
                    </h3>
                    <div className="text-xs text-text-secondary flex flex-col gap-1">
                      <span>📅 {experience.startTime}</span>
                      <span>📍 {experience.location}</span>
                    </div>
                  </div>

                  <p className="text-sm text-accent font-bold mb-5">
                    参加後にログを書くと +30pt 獲得！
                  </p>

                  <Button variant="secondary" fullWidth onClick={onClose}>
                    閉じる
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
