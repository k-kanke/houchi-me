import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { curiosityMap, pointExchanges } from '../data/dummyData'

const sectionAnim = (index) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: index * 0.06, duration: 0.4 },
})

function LevelDots({ level, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < level
        return (
          <motion.span
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            className={
              filled
                ? 'w-2.5 h-2.5 rounded-full bg-accent'
                : 'w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10'
            }
          />
        )
      })}
    </div>
  )
}

function Stars({ count = 0, max = 5 }) {
  return (
    <div className="flex items-center text-sm">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={i < count ? 'text-accent' : 'text-white/15'}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function TabButton({ id, label, icon, badge, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 h-12 flex items-center justify-center text-base ${
        active ? 'text-white' : 'text-white/50'
      }`}
    >
      <span className="flex items-center gap-1">
        <span>{icon}</span>
        <span className="text-xs font-bold">{label}</span>
        {badge != null && badge > 0 && (
          <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-white/15 text-[10px] text-white">
            {badge}
          </span>
        )}
      </span>
      {active && (
        <motion.span
          layoutId="profile-tab"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-12 bg-white"
        />
      )}
    </button>
  )
}

function ProfileScreen({ user, reservations = [], logs = [], onWriteLog }) {
  const [tab, setTab] = useState('curiosity')

  const handle = `@${(user.name || '').toString().toLowerCase().replace(/\s+/g, '_')}`
  const progressRemaining = Math.max(0, user.nextTitlePoints - user.points)
  const pct = Math.min(
    100,
    Math.max(0, (user.points / user.nextTitlePoints) * 100),
  )

  return (
    <div className="relative w-full h-full overflow-y-auto no-scrollbar bg-black pb-24 text-white">
      {/* (1) トップバー */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <span className="text-xl text-white cursor-pointer select-none">
          ←
        </span>
        <div className="flex items-center gap-1">
          <span className="text-base font-bold">{handle}</span>
          <span className="text-xs">▾</span>
        </div>
        <span className="text-xl text-white cursor-pointer select-none">
          ≡
        </span>
      </div>

      {/* (2) アバター + 名前 */}
      <motion.section
        {...sectionAnim(0)}
        className="flex flex-col items-center mt-2 px-4"
      >
        <div className="w-24 h-24 rounded-full bg-bg-elevated border-2 border-white/15 flex items-center justify-center text-5xl shadow-glow">
          {user.avatar}
        </div>
        <h1 className="text-lg font-bold mt-3">{handle}</h1>
      </motion.section>

      {/* (3) ステータス3カラム */}
      <motion.section
        {...sectionAnim(1)}
        className="flex justify-center items-center gap-8 mt-4 px-4"
      >
        <div className="flex flex-col items-center cursor-pointer">
          <span className="text-lg font-bold">0</span>
          <span className="text-xs text-white/55 mt-0.5">フォロー中</span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col items-center cursor-pointer">
          <span className="text-lg font-bold">12</span>
          <span className="text-xs text-white/55 mt-0.5">フォロワー</span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col items-center cursor-pointer">
          <span className="text-lg font-bold">{user.points}</span>
          <span className="text-xs text-white/55 mt-0.5">ポイント</span>
        </div>
      </motion.section>

      {/* (4) アクションボタン行 */}
      <motion.section
        {...sectionAnim(2)}
        className="flex items-center justify-center gap-2 mt-5 px-4"
      >
        <button
          type="button"
          className="flex-1 h-9 bg-bg-elevated border border-white/10 rounded-md text-sm font-bold text-white"
        >
          プロフィールを編集
        </button>
        <button
          type="button"
          className="w-9 h-9 bg-bg-elevated border border-white/10 rounded-md flex items-center justify-center text-base"
        >
          🔖
        </button>
      </motion.section>

      {/* (5) バイオ */}
      <motion.section
        {...sectionAnim(3)}
        className="text-xs text-center text-white/85 px-8 mt-4 leading-relaxed"
      >
        <div>🏆 {user.title}</div>
        <div className="text-white/55 mt-1">
          {user.nextTitle} まで残り {progressRemaining}pt 🌱
        </div>
      </motion.section>

      {/* (6) 進捗バー */}
      <motion.div
        {...sectionAnim(4)}
        className="mx-8 mt-3 relative h-1 bg-white/10 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-orange-300"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </motion.div>

      {/* (7) タブバー */}
      <motion.div
        {...sectionAnim(5)}
        className="relative flex items-center justify-around border-t border-white/10 mt-6"
      >
        <TabButton
          id="curiosity"
          icon="🗺"
          label="マップ"
          active={tab === 'curiosity'}
          onClick={() => setTab('curiosity')}
        />
        <TabButton
          id="reserved"
          icon="📅"
          label="予約中"
          badge={reservations.length}
          active={tab === 'reserved'}
          onClick={() => setTab('reserved')}
        />
        <TabButton
          id="logs"
          icon="📝"
          label="ログ"
          badge={logs.length}
          active={tab === 'logs'}
          onClick={() => setTab('logs')}
        />
        <TabButton
          id="exchange"
          icon="🎁"
          label="交換"
          active={tab === 'exchange'}
          onClick={() => setTab('exchange')}
        />
      </motion.div>

      {/* (8) タブ別コンテンツ */}
      <AnimatePresence mode="wait">
        {tab === 'curiosity' && (
          <motion.section
            key="curiosity"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-3 px-4"
          >
            {curiosityMap.map((cluster, idx) => (
              <motion.div
                key={cluster.cluster}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.35 }}
                className="bg-bg-secondary border border-line rounded-2xl p-4 mb-3"
              >
                <h3 className="text-sm font-bold text-text-primary mb-3">
                  {cluster.icon} {cluster.cluster}
                </h3>
                <div>
                  {cluster.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm text-text-secondary flex-1">
                        {item.name}
                      </span>
                      <span className="text-xs font-mono text-text-muted mr-3">
                        Lv.{item.level}
                      </span>
                      <LevelDots level={item.level} max={item.max ?? 5} />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.section>
        )}

        {tab === 'reserved' && (
          <motion.section
            key="reserved"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-3 px-4"
          >
            {reservations.length === 0 ? (
              <div className="text-center text-white/40 text-sm py-12">
                予約中の体験会はありません
              </div>
            ) : (
              reservations.map((r) => (
                <div
                  key={r.id}
                  className="bg-bg-secondary rounded-2xl border border-line p-4 mb-3"
                >
                  <h3 className="text-base font-bold text-text-primary">
                    {r.title}
                  </h3>
                  <p className="text-xs text-white/55 mt-1">
                    {r.startTime} • {r.location}
                  </p>
                  <div className="border-t border-white/10 my-3" />
                  {r.completed ? (
                    <Button
                      variant="ghost"
                      size="md"
                      fullWidth
                      disabled
                      onClick={() => {}}
                    >
                      ログ済み
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onClick={() => onWriteLog && onWriteLog(r)}
                    >
                      参加後ログを書く
                    </Button>
                  )}
                </div>
              ))
            )}
          </motion.section>
        )}

        {tab === 'logs' && (
          <motion.section
            key="logs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-3 px-4"
          >
            {logs.length === 0 ? (
              <div className="text-center text-white/40 text-sm py-12">
                まだログはありません
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-bg-secondary rounded-2xl border border-line p-4 mb-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-text-primary flex-1">
                      {log.title}
                    </h3>
                    <span className="text-xs font-mono text-text-muted shrink-0">
                      {log.date}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed mt-2">
                    {log.comment}
                  </p>
                  <div className="flex items-center justify-between gap-3 mt-3">
                    <Badge tone="soft" size="sm">
                      +{log.pointEarned}pt
                    </Badge>
                    <Stars count={log.funRating} max={5} />
                  </div>
                </div>
              ))
            )}
          </motion.section>
        )}

        {tab === 'exchange' && (
          <motion.section
            key="exchange"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-3 px-4 opacity-50"
          >
            <p className="text-xs text-white/55 text-center mb-3">
              ※ 近日公開予定
            </p>
            {pointExchanges.map((ex, i) => (
              <div
                key={`${ex.reward}-${i}`}
                className="bg-bg-secondary rounded-2xl border border-line p-4 mb-2 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ex.icon}</span>
                  <span className="text-sm font-bold text-text-primary">
                    {ex.reward}
                  </span>
                </div>
                <span className="font-display text-accent text-xl">
                  {ex.points}pt
                </span>
              </div>
            ))}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProfileScreen
