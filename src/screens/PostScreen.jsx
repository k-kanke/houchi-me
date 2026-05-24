import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import { genres } from '../data/dummyData';
import { supabase } from '../lib/supabase';

const DURATION_OPTIONS = ['30分', '60分', '90分', '120分', 'その他'];

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      disabled={disabled}
      className={`relative w-10 h-6 rounded-full border border-white/10 flex items-center p-0.5 ${
        checked ? 'bg-bg-elevated' : 'bg-bg-elevated'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`block w-4 h-4 rounded-full ${
          checked ? 'bg-accent' : 'bg-white/40'
        }`}
        style={{ marginLeft: checked ? 16 : 0 }}
      />
    </button>
  );
}

function Row({ index, icon, label, children, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3.5 cursor-pointer"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-bold">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-white/85">
        {children}
      </div>
    </motion.div>
  );
}

export default function PostScreen({ onSubmit, onBackToHome }) {
  const [form, setForm] = useState({
    title: '',
    genre: '',
    description: '',
    date: '',
    time: '',
    location: '',
    duration: '60分',
    isFirstTimeFree: true,
    priceAmount: '',
    capacity: 6,
    isBeginnerFriendly: true,
    isFriendOk: true,
    thumbnail: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const valid =
    form.title.trim() &&
    form.genre &&
    form.description.trim() &&
    form.location.trim() &&
    form.date &&
    form.time;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setMediaFile(file);
    setMediaType(type);
    setMediaPreview(URL.createObjectURL(file));
  };

  const uploadMedia = async () => {
    if (!mediaFile) return null;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', mediaFile);
      const { data, error } = await supabase.functions.invoke('upload-media', { body });
      if (error || !data?.mediaUrl) return null;
      return data.mediaUrl;
    } finally {
      setUploading(false);
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    const mediaUrl = await uploadMedia();
    await onSubmit?.({ ...form, mediaUrl });
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleCoverClick = () => fileInputRef.current?.click();

  const decCapacity = () =>
    update({ capacity: Math.max(1, form.capacity - 1) });
  const incCapacity = () =>
    update({ capacity: Math.min(20, form.capacity + 1) });

  const particles = Array.from({ length: 7 }, (_, i) => i);

  return (
    <div className="relative w-full h-full overflow-y-auto no-scrollbar bg-black pb-24 text-white">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 pt-12 pb-3 border-b border-white/10">
              <span className="text-xl cursor-pointer select-none">✕</span>
              <span className="text-base font-bold">投稿の準備</span>
              <span className="text-sm text-white/55 cursor-pointer select-none">
                ドラフト
              </span>
            </div>

            {/* Cover + Caption */}
            <div className="flex gap-3 px-4 pt-4">
              <button
                type="button"
                onClick={handleCoverClick}
                className="w-28 aspect-[3/4] rounded-xl border border-white/15 bg-bg-secondary flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors shrink-0 overflow-hidden relative"
              >
                {mediaPreview ? (
                  mediaType === 'video' ? (
                    <video src={mediaPreview} className="absolute inset-0 w-full h-full object-cover" muted />
                  ) : (
                    <img src={mediaPreview} className="absolute inset-0 w-full h-full object-cover" alt="cover" />
                  )
                ) : (
                  <>
                    <span className="text-4xl">📸</span>
                    <span className="text-[10px] text-white/55 mt-1.5">カバー</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="flex-1 flex flex-col">
                <span className="text-[10px] text-white/55 font-bold tracking-wider uppercase">
                  タイトル
                </span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="例：街角の小さな陶芸時間"
                  className="w-full bg-transparent text-base font-bold text-white placeholder:text-white/40 outline-none border-b border-white/10 pb-2 mb-3"
                />
                <span className="text-[10px] text-white/55 font-bold tracking-wider uppercase">
                  説明
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="どんな体験？参加者にひと言。"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none resize-none min-h-[60px] pt-1"
                />
              </div>
            </div>

            {/* Hashtag suggestions */}
            <div className="px-4 mt-2 flex gap-1.5 flex-wrap">
              {genres.map((g) => {
                const active = form.genre === g;
                return (
                  <motion.button
                    key={g}
                    type="button"
                    layout
                    whileTap={{ scale: 0.95 }}
                    onClick={() => update({ genre: g })}
                    className={`text-xs px-2.5 py-1 rounded-md cursor-pointer transition-colors border ${
                      active
                        ? 'bg-white text-black border-white'
                        : 'bg-bg-elevated text-white border-white/10 hover:border-white/40'
                    }`}
                  >
                    # {g}
                  </motion.button>
                );
              })}
            </div>

            {/* Detail Form Section */}
            <div className="mt-6 mx-4 rounded-xl border border-white/10 bg-bg-secondary divide-y divide-white/5">
              {/* 1. 開催日時 */}
              <Row index={0} icon="🗓" label="開催日時">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => update({ date: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-bg-elevated border border-white/10 rounded-md px-2 py-1.5 text-xs text-white text-right [color-scheme:dark]"
                  />
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => update({ time: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-bg-elevated border border-white/10 rounded-md px-2 py-1.5 text-xs text-white text-right [color-scheme:dark]"
                  />
                </div>
              </Row>

              {/* 2. 開催場所 */}
              <Row index={1} icon="📍" label="開催場所">
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => update({ location: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="下北沢"
                  className="bg-transparent text-right text-sm w-32 outline-none placeholder:text-white/30 text-white"
                />
              </Row>

              {/* 3. 所要時間 */}
              <Row index={2} icon="⏱" label="所要時間">
                <select
                  value={form.duration}
                  onChange={(e) => update({ duration: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent text-right text-sm text-white outline-none border-none cursor-pointer [color-scheme:dark]"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d} className="bg-bg-secondary">
                      {d}
                    </option>
                  ))}
                </select>
                <span className="text-white/40">›</span>
              </Row>

              {/* 4. 参加費 */}
              <Row index={3} icon="💰" label="参加費">
                <div className="flex items-center gap-3">
                  {form.isFirstTimeFree ? (
                    <span className="text-sm text-white/85">初回無料</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={form.priceAmount}
                        onChange={(e) =>
                          update({ priceAmount: e.target.value })
                        }
                        onClick={(e) => e.stopPropagation()}
                        placeholder="500"
                        className="bg-transparent text-right text-sm w-16 outline-none placeholder:text-white/30 text-white"
                      />
                      <span className="text-sm text-white/55">円</span>
                    </div>
                  )}
                  <Toggle
                    checked={form.isFirstTimeFree}
                    onChange={(v) => update({ isFirstTimeFree: v })}
                  />
                </div>
              </Row>

              {/* 5. 定員 */}
              <Row index={4} icon="👥" label="定員">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      decCapacity();
                    }}
                    disabled={form.capacity <= 1}
                    className="w-6 h-6 rounded-full bg-bg-elevated border border-white/10 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    −
                  </button>
                  <span className="font-display text-2xl text-accent leading-none min-w-[28px] text-center">
                    {form.capacity}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      incCapacity();
                    }}
                    disabled={form.capacity >= 20}
                    className="w-6 h-6 rounded-full bg-bg-elevated border border-white/10 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    ＋
                  </button>
                </div>
              </Row>

              {/* 6. 初心者歓迎 */}
              <Row index={5} icon="🌱" label="初心者歓迎">
                <Toggle
                  checked={form.isBeginnerFriendly}
                  onChange={(v) => update({ isBeginnerFriendly: v })}
                />
              </Row>

              {/* 7. 友達参加OK */}
              <Row index={6} icon="👯" label="友達参加OK">
                <Toggle
                  checked={form.isFriendOk}
                  onChange={(v) => update({ isFriendOk: v })}
                />
              </Row>

              {/* 8. 公開範囲 */}
              <Row index={7} icon="🎬" label="公開範囲">
                <span className="text-sm text-white/85">全員</span>
                <span className="text-white/40">›</span>
              </Row>

              {/* 9. コメントを許可 */}
              <Row index={8} icon="💬" label="コメントを許可">
                <Toggle checked={true} onChange={() => {}} />
              </Row>
            </div>

            {/* Footer */}
            <div className="mt-6 px-4 sticky bottom-0 bg-gradient-to-t from-black via-black to-transparent pt-4 pb-4 flex items-center gap-3 z-10">
              <button
                type="button"
                className="flex-1 h-12 rounded-md bg-bg-elevated border border-white/10 text-sm font-bold text-white cursor-pointer"
              >
                ドラフト
              </button>
              <button
                type="button"
                disabled={!valid || submitting}
                onClick={handleSubmit}
                className="flex-1 h-12 rounded-md bg-accent text-black text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {uploading ? 'アップロード中…' : submitting ? '投稿中…' : '投稿する'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 14 }}
                className="text-7xl"
              >
                ✅
              </motion.div>
              {particles.map((i) => {
                const angle = (i / particles.length) * Math.PI * 2;
                const dist = 90 + (i % 3) * 18;
                const tx = Math.cos(angle) * dist;
                const ty = Math.sin(angle) * dist;
                return (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: tx,
                      y: ty,
                      scale: [0, 1, 0.6],
                    }}
                    transition={{
                      duration: 1.1,
                      delay: 0.15 + i * 0.04,
                      ease: 'easeOut',
                    }}
                    className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 rounded-sm bg-accent"
                  />
                );
              })}
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold mt-4 text-white"
            >
              投稿しました
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-4 bg-bg-secondary rounded-xl border border-white/10 p-4 w-full max-w-xs"
            >
              <p className="text-base font-bold text-white">
                「{form.title}」
              </p>
              <p className="text-xs text-white/55 mt-1">
                Homeフィードに表示されます
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full mt-8 max-w-xs"
            >
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={onBackToHome}
              >
                Homeに戻る
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
