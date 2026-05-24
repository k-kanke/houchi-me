import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import StarRating from '../components/StarRating.jsx'
import PointBurst from '../components/PointBurst.jsx'
import { nextGenreSuggestions } from '../data/dummyData.js'

function LogScreen({ reservation, onSave, onCancel, onFinish }) {
  const [comment, setComment] = useState('')
  const [funRating, setFunRating] = useState(0)
  const [againRating, setAgainRating] = useState(0)
  const [nextGenres, setNextGenres] = useState([])
  const [photo, setPhoto] = useState(null)
  const [saved, setSaved] = useState(false)
  const [burst, setBurst] = useState(false)

  const valid = comment.trim() !== '' && funRating > 0 && againRating > 0

  const toggleGenre = (g) => {
    setNextGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  const handleSave = () => {
    if (!valid) return
    const log = {
      id: `log-${Date.now()}`,
      reservationId: reservation?.id,
      title: reservation?.title,
      date: new Date().toLocaleDateString('ja-JP'),
      comment,
      funRating,
      againRating,
      nextGenres,
      photo,
      pointEarned: 30,
    }
    onSave?.(log)
    setBurst(true)
    setSaved(true)
  }

  const togglePhoto = () => {
    setPhoto((p) => (p === 'placeholder' ? null : 'placeholder'))
  }

  const fieldAnim = (i) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.05 * i, duration: 0.35, ease: 'easeOut' },
  })

  return (
    <div className="relative w-full h-full overflow-y-auto no-scrollbar bg-bg-primary pb-24 px-4 pt-6">
      <AnimatePresence mode="wait">
        {!saved && (
          <motion.div
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={onCancel}
                className="text-2xl text-text-primary hover:text-accent transition-colors cursor-pointer leading-none"
                aria-label="戻る"
              >
                ←
              </button>
              <h1 className="font-display text-2xl tracking-wider text-text-primary">
                LOG
              </h1>
              <button
                className="text-2xl text-text-muted hover:text-text-primary transition-colors cursor-pointer leading-none"
                aria-label="設定"
              >
                ⋯
              </button>
            </div>
            <p className="text-xs text-text-muted mb-6 text-center">今日の体験ログ</p>

            {/* Reservation card */}
            <motion.div {...fieldAnim(0)} className="bg-bg-secondary rounded-2xl border border-line p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">🎨</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone="success" size="sm">参加済</Badge>
                  </div>
                  <h2 className="text-base font-bold text-text-primary truncate">
                    {reservation?.title}
                  </h2>
                  <p className="text-xs text-text-muted mt-1">
                    {reservation?.startTime} • {reservation?.location}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Comment */}
            <motion.div {...fieldAnim(1)} className="mb-6">
              <label className="block text-xs font-bold text-text-secondary mb-2 tracking-wider uppercase">
                感想を書く *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="やってみてどうだった？驚いたこと・次にやりたいこと、なんでもOK"
                className="w-full min-h-[120px] bg-bg-elevated border border-line rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none resize-none"
                rows={4}
              />
            </motion.div>

            {/* Fun rating */}
            <motion.div {...fieldAnim(2)} className="mb-6">
              <label className="block text-xs font-bold text-text-secondary mb-2 tracking-wider uppercase">
                面白かった度
              </label>
              <div className="flex items-center justify-between">
                <StarRating value={funRating} onChange={setFunRating} size="lg" />
                <span className="text-sm font-mono text-text-muted">
                  {funRating}/5
                </span>
              </div>
            </motion.div>

            {/* Again rating */}
            <motion.div {...fieldAnim(3)} className="mb-6">
              <label className="block text-xs font-bold text-text-secondary mb-2 tracking-wider uppercase">
                またやりたい度
              </label>
              <div className="flex items-center justify-between">
                <StarRating value={againRating} onChange={setAgainRating} size="lg" />
                <span className="text-sm font-mono text-text-muted">
                  {againRating}/5
                </span>
              </div>
            </motion.div>

            {/* Next genres */}
            <motion.div {...fieldAnim(4)} className="mb-6">
              <label className="block text-xs font-bold text-text-secondary mb-1 tracking-wider uppercase">
                次に気になるジャンル
              </label>
              <p className="text-xs text-text-muted mb-3">複数選択OK</p>
              <div className="flex flex-wrap gap-2">
                {nextGenreSuggestions.map((g) => {
                  const active = nextGenres.includes(g)
                  return (
                    <motion.button
                      key={g}
                      layout
                      whileTap={{ scale: 0.95 }}
                      animate={{ scale: active ? 1.04 : 1 }}
                      onClick={() => toggleGenre(g)}
                      className={`rounded-full px-4 py-2 text-xs font-bold cursor-pointer transition-all ${
                        active
                          ? 'bg-accent text-black shadow-glow'
                          : 'bg-bg-elevated text-text-secondary border border-line'
                      }`}
                    >
                      {g}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

            {/* Photo */}
            <motion.div {...fieldAnim(5)} className="mb-8">
              <label className="block text-xs font-bold text-text-secondary mb-2 tracking-wider uppercase">
                写真を追加 (任意)
              </label>
              <button
                type="button"
                onClick={togglePhoto}
                className="w-full h-32 rounded-2xl border-2 border-dashed border-line bg-bg-secondary mt-1 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors"
              >
                {photo === 'placeholder' ? (
                  <>
                    <span className="text-2xl">✅</span>
                    <span className="text-xs text-text-secondary mt-1">写真設定済み</span>
                    <span className="text-[10px] text-text-muted mt-1">タップで解除</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">📷</span>
                    <span className="text-xs text-text-muted mt-2">タップして選択</span>
                  </>
                )}
              </button>
            </motion.div>

            {/* Submit */}
            <motion.div {...fieldAnim(6)}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!valid}
                onClick={handleSave}
              >
                ログを保存する
              </Button>
              {!valid && (
                <p className="text-[11px] text-text-muted text-center mt-3">
                  感想と2つの星評価を入力すると保存できます
                </p>
              )}
            </motion.div>
          </motion.div>
        )}

        {saved && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center min-h-[70vh] text-center"
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: 'spring', stiffness: 200, damping: 14 }}
              className="text-7xl"
            >
              ✅
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
              className="text-2xl font-bold mt-4 text-text-primary"
            >
              ログを保存しました
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="mt-6 w-full bg-bg-secondary border border-line rounded-2xl p-6 flex flex-col items-center"
            >
              <div className="font-display text-5xl text-accent leading-none">
                +30pt 獲得！
              </div>
              <p className="text-sm text-text-secondary mt-3">
                陶芸カテゴリ Lv.1 解放 🎉
              </p>
              <p className="text-xs text-text-muted mt-2">
                手を動かす系の好奇心が成長しました
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.4 }}
              className="w-full mt-8 flex flex-col gap-3"
            >
              <Button variant="primary" size="lg" fullWidth onClick={onFinish}>
                プロフィールを見る
              </Button>
              <Button variant="ghost" size="md" fullWidth onClick={onFinish}>
                閉じる
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PointBurst
        show={burst}
        points={30}
        label="陶芸カテゴリ Lv.1 解放 🎉"
        onDone={() => setBurst(false)}
        duration={1600}
      />
    </div>
  )
}

export default LogScreen
