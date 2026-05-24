import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGenreVisual } from '../styles/tokens.js';

// 決定論的なダミーカウント生成（experience.id をシードに）
function seededInt(seed, min, max) {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  const v = Math.abs(h);
  return min + (v % (max - min + 1));
}

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function toHandle(name) {
  if (!name) return 'user';
  return name
    .toLowerCase()
    .replace(/[\s　・·]/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export default function ExperienceCard({
  experience,
  reserved = false,
  onDetail,
  // eslint-disable-next-line no-unused-vars
  onReserve,
}) {
  const visual = getGenreVisual(experience.genre);

  // 初期カウント（idでばらつかせる）
  const initialLikes = seededInt(experience.id + 'l', 8000, 98000);
  const initialComments = seededInt(experience.id + 'c', 80, 980);
  const initialSaves = seededInt(experience.id + 's', 500, 4500);
  const initialShares = seededInt(experience.id + 'sh', 40, 480);

  const [followed, setFollowed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(initialSaves);
  const [shareCount, setShareCount] = useState(initialShares);

  // ダブルタップ大ハート
  const lastTapRef = useRef(0);
  const [bigHearts, setBigHearts] = useState([]);

  // シングルタップで再生/停止アイコンフラッシュ
  const [playFlash, setPlayFlash] = useState(null); // {key, icon}
  const [paused, setPaused] = useState(false);
  const singleTapTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    };
  }, []);

  const handleLikeToggle = () => {
    setIsLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => c + (next ? 1 : -1));
      return next;
    });
  };

  const handleSaveToggle = () => {
    setSaved((prev) => {
      const next = !prev;
      setSaveCount((c) => c + (next ? 1 : -1));
      return next;
    });
  };

  const handleShare = () => {
    setShareCount((c) => c + 1);
  };

  // ルート領域へのタップ（ダブルタップで大ハート、シングルで再生/停止）
  const handleRootClick = (e) => {
    // ボタン等の操作要素はネイティブハンドラに任せる
    if (e.target.closest('[data-stop]')) return;

    const now = Date.now();
    const delta = now - lastTapRef.current;

    if (delta < 300 && delta > 0) {
      // ダブルタップ
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapRef.current = 0;

      // 位置（中央寄りだがタップ位置で微調整）
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = now;
      setBigHearts((arr) => [...arr, { id, x, y }]);
      setTimeout(() => {
        setBigHearts((arr) => arr.filter((h) => h.id !== id));
      }, 950);

      if (!isLiked) {
        setIsLiked(true);
        setLikeCount((c) => c + 1);
      }
    } else {
      lastTapRef.current = now;
      // シングルタップ確定は300ms後
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => {
        setPaused((p) => {
          const next = !p;
          setPlayFlash({ key: Date.now(), icon: next ? '❚❚' : '▶︎' });
          return next;
        });
        singleTapTimerRef.current = null;
      }, 310);
    }
  };

  const handle = '@' + toHandle(experience.creator);
  const genreTag = '#' + (experience.genre || '').replace(/[・·\s]/g, '');
  const hashtags = [
    genreTag,
    '#体験会',
    experience.isBeginnerFriendly ? '#初心者歓迎' : null,
    experience.isFirstTimeFree ? '#初回無料' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="relative w-full h-[100dvh] min-h-[100vh] overflow-hidden bg-black select-none"
      onClick={handleRootClick}
    >
      {/* 1. フルブリード背景 */}
      {experience.thumbnailUrl ? (
        experience.thumbnailUrl.includes('iframe.cloudflarestream.com') ? (
          <iframe
            src={`${experience.thumbnailUrl}?autoplay=true&muted=true&loop=true&controls=false`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <img
            src={experience.thumbnailUrl}
            className="absolute inset-0 w-full h-full object-cover"
            alt={experience.title}
          />
        )
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{ background: visual.gradient }}
          />
          <motion.div
            className="text-[260px] opacity-25 select-none absolute top-[18%] left-1/2 -translate-x-1/2 leading-none pointer-events-none"
            animate={{ y: [0, -12, 0], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {visual.emoji}
          </motion.div>
        </>
      )}

      {/* 暗化グラデ：上 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />
      {/* 暗化グラデ：下 */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

      {/* 2. 右レール（TikTokアイコン縦列） */}
      <div className="absolute right-1.5 bottom-28 flex flex-col gap-4 z-20 items-center">
        {/* (a) アバター + フォロー */}
        <motion.button
          data-stop
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            setFollowed((v) => !v);
          }}
          className="relative"
          aria-label="follow"
        >
          <div
            className="w-12 h-12 rounded-full bg-bg-elevated border-2 border-white flex items-center justify-center text-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
            style={{ background: visual.gradient }}
          >
            <span className="leading-none">{experience.creatorAvatar}</span>
          </div>
          <AnimatePresence>
            {!followed ? (
              <motion.span
                key="plus"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#FE2C55] flex items-center justify-center text-white text-xs font-bold shadow"
              >
                +
              </motion.span>
            ) : (
              <motion.span
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#FE2C55] text-[10px] font-bold shadow"
              >
                ✓
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* (b) ハート */}
        <motion.button
          data-stop
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            handleLikeToggle();
          }}
          className="flex flex-col items-center"
          aria-label="like"
        >
          <motion.span
            key={isLiked ? 'liked' : 'unliked'}
            animate={isLiked ? { scale: [1, 1.4, 0.9, 1] } : { scale: 1 }}
            transition={{ duration: 0.45 }}
            className="text-[36px] leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
          >
            {isLiked ? '❤️' : '🤍'}
          </motion.span>
          <span className="text-xs font-bold text-white mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatCount(likeCount)}
          </span>
        </motion.button>

        {/* (c) コメント */}
        <motion.button
          data-stop
          whileTap={{ scale: 0.85 }}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center"
          aria-label="comment"
        >
          <span className="text-[34px] leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            💬
          </span>
          <span className="text-xs font-bold text-white mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatCount(initialComments)}
          </span>
        </motion.button>

        {/* (d) ブックマーク */}
        <motion.button
          data-stop
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            handleSaveToggle();
          }}
          className="flex flex-col items-center"
          aria-label="save"
        >
          <motion.span
            animate={saved ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={`text-[34px] leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] ${
              saved ? 'text-accent' : 'grayscale'
            }`}
            style={saved ? { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' } : {}}
          >
            🔖
          </motion.span>
          <span className="text-xs font-bold text-white mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatCount(saveCount)}
          </span>
        </motion.button>

        {/* (e) シェア */}
        <motion.button
          data-stop
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          className="flex flex-col items-center"
          aria-label="share"
        >
          <span className="text-[34px] leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            ↗
          </span>
          <span className="text-xs font-bold text-white mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatCount(shareCount)}
          </span>
        </motion.button>

        {/* (f) スピニングディスク */}
        <motion.div
          className="w-10 h-10 rounded-full overflow-hidden border border-white/30 flex items-center justify-center mt-2 bg-cover bg-center"
          style={{ backgroundImage: visual.gradient }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
        >
          <span className="text-xl leading-none">{visual.emoji}</span>
        </motion.div>
      </div>

      {/* 3. 左下キャプションエリア */}
      <div className="absolute bottom-24 left-3 right-20 z-20 flex flex-col gap-1">
        <div className="text-base font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
          {handle}
        </div>
        <div className="text-sm font-bold text-white leading-snug [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
          {experience.title}
        </div>
        <div className="text-xs text-white/85 leading-relaxed line-clamp-2 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
          {experience.description}
        </div>
        <div className="text-xs font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
          {hashtags}
        </div>
        {/* ♪サウンド行 */}
        <div className="flex items-center gap-1.5 text-xs text-white mt-1 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
          <motion.span
            className="text-sm leading-none"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            ♪
          </motion.span>
          <div className="overflow-hidden max-w-[60vw] whitespace-nowrap">
            <motion.div
              className="inline-block whitespace-nowrap"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              <span className="pr-8">
                {experience.creator} の体験 · オリジナルサウンド
              </span>
              <span className="pr-8">
                {experience.creator} の体験 · オリジナルサウンド
              </span>
            </motion.div>
          </div>
        </div>

        {/* CTAピル — キャプション末尾に内包してタイトル重なりを回避 */}
        <div className="mt-2" data-stop>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={(e) => {
              e.stopPropagation();
              onDetail && onDetail();
            }}
            className={`rounded-md px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow backdrop-blur ${
              reserved
                ? 'bg-accent text-black'
                : 'bg-white/90 text-black'
            }`}
          >
            {reserved ? (
              <>
                <span>✓</span>
                <span>予約済み</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>予約する ▸</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* 5. プログレスバー */}
      <div className="absolute bottom-16 left-0 right-0 h-[2px] bg-white/15 z-20 overflow-hidden">
        <motion.div
          className="h-full w-full bg-white origin-left"
          animate={{ scaleX: [0, 1] }}
          transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
        />
      </div>

      {/* 6. ダブルタップ大ハート */}
      <AnimatePresence>
        {bigHearts.map((h) => (
          <motion.span
            key={h.id}
            initial={{ scale: 0, opacity: 0, rotate: -15 }}
            animate={{
              scale: [0, 1.3, 1, 0.95],
              opacity: [0, 1, 1, 0],
              rotate: [-15, 0, 0, 5],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute text-[160px] leading-none pointer-events-none z-30 select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            style={{
              left: h.x,
              top: h.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            ❤️
          </motion.span>
        ))}
      </AnimatePresence>

      {/* 7. シングルタップ再生/停止フラッシュ */}
      <AnimatePresence>
        {playFlash && (
          <motion.span
            key={playFlash.key}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            onAnimationComplete={() => setPlayFlash(null)}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl text-white/90 pointer-events-none z-30 select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          >
            {playFlash.icon}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
