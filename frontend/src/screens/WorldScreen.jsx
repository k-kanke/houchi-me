import { useEffect, useRef, useState } from 'react'
import { initLibraryScene } from '../world/initLibraryScene.js'
import {
  CLONE_STATS,
  INITIAL_TIMELINE,
  TODAY_TOPIC,
} from '../data/hochiDummy.js'

function TimelineItem({ item }) {
  const cls = ['tl-item', item.variant].filter(Boolean).join(' ')
  const parts = item.text.split(/(「[^」]+」)/g)
  return (
    <div className={cls}>
      <div className="tl-time">{item.time}</div>
      <div className="tl-text">
        {parts.map((part, i) =>
          part.startsWith('「') ? <b key={i}>{part}</b> : part,
        )}
      </div>
      {item.tag && (
        <span className={`tl-tag ${item.tagVariant || ''}`}>{item.tag}</span>
      )}
    </div>
  )
}

export default function WorldScreen({ clone, onOpenTopic }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const loaderRef = useRef(null)
  const loaderStatusRef = useRef(null)
  const sceneCleanupRef = useRef(null)
  const sceneStartedRef = useRef(false)

  const [hud, setHud] = useState({
    location: '中央デスク',
    actTitle: '中央デスクで執筆中',
    actSub: '「エージェント設計の原理」 · 187文字 · ライブ',
    nowAction: '思考中',
    nowTitle: '「クローンはどうすれば自分自身と生産的に反論できるか？」',
    nowBody:
      'Miraがあなたの2024年のエッセイ3本と生成エージェント論文を接続中。エージェント設計の原理に新しいノートを起草しています。',
    nowPercent: 64,
    wsNotes: 14,
    wsReads: 3,
    wsThoughts: 72,
  })

  const [overlay, setOverlay] = useState(null)

  useEffect(() => {
    if (!canvasRef.current || !rootRef.current || sceneStartedRef.current) return
    sceneStartedRef.current = true

    const ui = {
      'vital-focus': rootRef.current.querySelector('#vital-focus'),
      'vital-energy': rootRef.current.querySelector('#vital-energy'),
      'vital-curiosity': rootRef.current.querySelector('#vital-curiosity'),
      minimap: rootRef.current.querySelector('#minimap'),
      'bc-location': rootRef.current.querySelector('#bc-location'),
      'hud-pos': rootRef.current.querySelector('#hud-pos'),
      'hud-speed': rootRef.current.querySelector('#hud-speed'),
      'hud-time': rootRef.current.querySelector('#hud-time'),
      'cam-follow': rootRef.current.querySelector('#cam-follow'),
      'cam-orbit': rootRef.current.querySelector('#cam-orbit'),
      'cam-top': rootRef.current.querySelector('#cam-top'),
      'cam-cinema': rootRef.current.querySelector('#cam-cinema'),
      'act-title': rootRef.current.querySelector('#act-title'),
      'act-sub': rootRef.current.querySelector('#act-sub'),
      'ws-notes': rootRef.current.querySelector('#ws-notes'),
      'ws-reads': rootRef.current.querySelector('#ws-reads'),
      'ws-thoughts': rootRef.current.querySelector('#ws-thoughts'),
      'now-action': rootRef.current.querySelector('#now-action'),
      'now-title': rootRef.current.querySelector('#now-title'),
      'now-body': rootRef.current.querySelector('#now-body'),
      'now-fill': rootRef.current.querySelector('#now-fill'),
      'now-percent': rootRef.current.querySelector('#now-percent'),
    }

    sceneCleanupRef.current = initLibraryScene({
      canvas: canvasRef.current,
      loaderEl: loaderRef.current,
      loaderStatusEl: loaderStatusRef.current,
      ui,
      queryAll: (sel) => rootRef.current.querySelectorAll(sel),
      onWaypoint: (wp) => {
        setHud((prev) => ({
          ...prev,
          location: wp.location,
          actTitle: wp.action,
          actSub: wp.sub,
          nowAction: wp.nowAction,
          nowTitle: wp.nowTitle,
          nowBody: wp.nowBody?.replace(/<b>/g, '').replace(/<\/b>/g, '') || prev.nowBody,
        }))
      },
      onBooted: () => {},
    })

    return () => {
      sceneStartedRef.current = false
      sceneCleanupRef.current?.()
      sceneCleanupRef.current = null
    }
  }, [])

  const brandName = clone?.name || 'Mira'

  return (
    <div className="hochi-app" ref={rootRef}>
      <div
        id="loader"
        className="hochi-loader"
        ref={loaderRef}
      >
        <div className="loader-inner">
          <div className="loader-logo" />
          <div className="loader-title">放置me</div>
          <div className="loader-name">仮想世界に接続中</div>
          <div className="loader-bar" />
          <div className="loader-status" id="loader-status" ref={loaderStatusRef}>
            初期化中 · BOOTSTRAPPING SAPIENTIA
          </div>
        </div>
      </div>

      <canvas id="scene-canvas" ref={canvasRef} />
      <div className="vignette" />

      <div className="ui">
        <header className="topbar">
          <div className="brand">
            <div className="brand-logo" />
            <div className="brand-name">
              {brandName} <span>放置me · 叡智の図書館</span>
            </div>
          </div>
          <div className="search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            ナレッジベースを検索…
            <span className="kbd">⌘ K</span>
          </div>
          <div className="topbar-actions">
            <button type="button" className="icon-btn" title="通知" aria-label="通知">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <div className="avatar-pill">
              <div className="av">YS</div>
              <span>放置中</span>
            </div>
          </div>
        </header>

        <aside className="sidebar">
          <div className="clone-card">
            <div className="label">
              <span className="pulse" />
              クローン稼働中
            </div>
            <h3>{clone?.displayName || clone?.name}</h3>
            <p>{clone?.archetype || '感性探索型'} · {clone?.personalityShift || '少し外向的'}</p>
            <div className="clone-meta">
              <div>
                稼働
                <strong>{clone?.uptime || '14:23'}</strong>
              </div>
              <div>
                同期率
                <strong>{clone?.syncRate || '99.6%'}</strong>
              </div>
              <div>
                気分
                <strong>{clone?.mood || '思索'}</strong>
              </div>
              <div>
                MBTI
                <strong>{clone?.mbti || 'ENFP'}</strong>
              </div>
            </div>
          </div>

          <div className="vitals">
            <div className="vital focus">
              <div className="vital-lab">集中</div>
              <div className="vital-bar">
                <div className="vb-fill" id="vital-focus" style={{ width: '82%' }} />
              </div>
            </div>
            <div className="vital energy">
              <div className="vital-lab">活力</div>
              <div className="vital-bar">
                <div className="vb-fill" id="vital-energy" style={{ width: '67%' }} />
              </div>
            </div>
            <div className="vital curiosity">
              <div className="vital-lab">好奇心</div>
              <div className="vital-bar">
                <div className="vb-fill" id="vital-curiosity" style={{ width: '91%' }} />
              </div>
            </div>
          </div>

          <nav>
            <div className="nav-title">
              ワールド <span>+</span>
            </div>
            <ul className="nav-list">
              <li className="nav-item active">
                <span className="ico">📚</span>
                叡智の図書館 <span className="count">142</span>
              </li>
              <li className="nav-item">
                <span className="ico">🔭</span>
                天文台 <span className="count">38</span>
              </li>
              <li className="nav-item">
                <span className="ico">🎨</span>
                アトリエ 03 <span className="count">21</span>
              </li>
            </ul>
          </nav>

          <nav>
            <div className="nav-title">
              ページ <span>+</span>
            </div>
            <ul className="nav-list">
              <li className="nav-item">
                <span className="ico">📄</span>
                ナレッジベース
              </li>
              <ul className="nav-sub">
                <li className="nav-item active">エージェント設計の原理</li>
                <li className="nav-item">読書キュー</li>
                <li className="nav-item">毎日の振り返り</li>
              </ul>
              <li className="nav-item">AIメモリーボールト</li>
              <li className="nav-item">目標と習慣</li>
            </ul>
          </nav>

          <div className="minimap">
            <div className="minimap-header">
              ミニマップ
              <span className="live">追跡中</span>
            </div>
            <canvas className="minimap-canvas" id="minimap" />
          </div>
        </aside>

        <div className="main-area">
          <div className="breadcrumb-overlay">
            <div className="breadcrumb">
              叡智の図書館 <span className="sep">/</span> <b id="bc-location">{hud.location}</b>
            </div>
            <div className="view-tabs">
              <button type="button" className="view-tab" onClick={() => setOverlay('notes')}>
                ノート
              </button>
              <button type="button" className="view-tab active">
                ワールド
              </button>
              <button type="button" className="view-tab" onClick={() => setOverlay('chat')}>
                対話
              </button>
            </div>
          </div>

          <div className="hud-coord">
            座標 <span className="pos" id="hud-pos">X 0.0 · Y 0.0 · Z 0.0</span>
            <br />
            速度 <b id="hud-speed">0.00 m/s</b>
            <br />
            現地時刻 <b id="hud-time">14:23</b>
          </div>

          <div className="camera-hint">
            <div className="cam-btn active" id="cam-follow" title="追従カメラ">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
              </svg>
            </div>
            <div className="cam-btn" id="cam-orbit" title="軌道カメラ">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3a14 14 0 0 1 0 18" />
              </svg>
            </div>
            <div className="cam-btn" id="cam-top" title="俯瞰">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
              </svg>
            </div>
            <div className="cam-btn" id="cam-cinema" title="シネマ">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 8h20M6 4v4M10 4v4M14 4v4M18 4v4M2 16h20M6 20v-4M10 20v-4M14 20v-4M18 20v-4" />
              </svg>
            </div>
          </div>

          <div className="activity-badge">
            <div className="av-icon" id="act-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
            </div>
            <div className="av-text">
              <b id="act-title">{hud.actTitle}</b>
              <span className="sub" id="act-sub">{hud.actSub}</span>
            </div>
          </div>

          <div className="world-stats">
            <div className="ws-pill">
              <b id="ws-notes">{hud.wsNotes}</b>ノート
            </div>
            <div className="ws-pill">
              <b id="ws-reads">{hud.wsReads}</b>読書
            </div>
            <div className="ws-pill">
              <b id="ws-thoughts">{hud.wsThoughts}</b>思考
            </div>
          </div>
        </div>

        <aside className="right">
          <div>
            <div className="panel-header">
              <b>いま</b>
              <span>自動更新</span>
            </div>
            <div className="now-card" style={{ marginTop: 8 }}>
              <div className="now-title">
                <span className="dot" />
                <span id="now-action">{hud.nowAction}</span>
              </div>
              <h4 id="now-title">{hud.nowTitle}</h4>
              <p id="now-body">{hud.nowBody}</p>
              <div className="progress">
                <div className="progress-bar">
                  <div className="fill" id="now-fill" style={{ width: `${hud.nowPercent}%` }} />
                </div>
                <span id="now-percent">{hud.nowPercent}%</span>
              </div>
            </div>
          </div>

          <div>
            <div className="panel-header" style={{ marginTop: 6 }}>
              <b>今日のタイムライン</b>
              <span>ライブ</span>
            </div>
            <div className="timeline" id="timeline" style={{ marginTop: 8 }}>
              {INITIAL_TIMELINE.map((item) => (
                <TimelineItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div>
            <div className="panel-header">
              <b>クローンの統計</b>
              <span>直近7日</span>
            </div>
            <div className="stats-grid" style={{ marginTop: 8 }}>
              <div className="stat-box">
                <div className="lab">ノート</div>
                <div className="val">{CLONE_STATS.notes.val}</div>
                <div className="delta">{CLONE_STATS.notes.delta}</div>
              </div>
              <div className="stat-box">
                <div className="lab">読書</div>
                <div className="val">{CLONE_STATS.reads.val}</div>
                <div className="delta">{CLONE_STATS.reads.delta}</div>
              </div>
              <div className="stat-box">
                <div className="lab">思考</div>
                <div className="val">{CLONE_STATS.thoughts.val}</div>
                <div className="delta">{CLONE_STATS.thoughts.delta}</div>
              </div>
              <div className="stat-box">
                <div className="lab">同期率</div>
                <div className="val">{clone?.syncRate || CLONE_STATS.sync.val}</div>
                <div className="delta">{CLONE_STATS.sync.delta}</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="hochi-topic-btn"
            onClick={() => (onOpenTopic ? onOpenTopic() : setOverlay('topic'))}
          >
            今日のTopicを見る
          </button>
        </aside>

        <footer className="command">
          <div className="cmd-prefix">
            <div className="glyph">{brandName.charAt(0)}</div>
            {brandName}に指示
          </div>
          <input
            className="cmd-input"
            placeholder="例：「西の書架へ移動して、認知科学の本を読み込んで」"
          />
          <div className="cmd-suggestions">
            <button type="button" className="cmd-chip" onClick={() => setOverlay('topic')}>
              今日を要約
            </button>
            <button type="button" className="cmd-chip">
              明日を計画
            </button>
          </div>
          <button type="button" className="cmd-send" onClick={() => setOverlay('chat')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m22 2-7 20-4-9-9-4z" />
            </svg>
            送信
          </button>
        </footer>
      </div>

      {overlay && (
        <div className="hochi-overlay" role="dialog">
          <div className="hochi-overlay-panel">
            <button
              type="button"
              className="hochi-overlay-close"
              onClick={() => setOverlay(null)}
              aria-label="閉じる"
            >
              ×
            </button>
            {overlay === 'topic' && (
              <>
                <h2>今日のTopic</h2>
                <p className="hochi-topic-title">{TODAY_TOPIC.title}</p>
                <h3>なぜ持ち帰った？</h3>
                <p>{TODAY_TOPIC.reason}</p>
                <h3>関連ノート</h3>
                <ul>
                  {TODAY_TOPIC.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
                <div className="hochi-feedback">
                  <button type="button">気になる</button>
                  <button type="button">違う</button>
                  <button type="button">もっと知りたい</button>
                </div>
              </>
            )}
            {overlay === 'chat' && (
              <>
                <h2>クローンと対話</h2>
                <p className="hochi-chat-hint">なぜこれに興味を持ったの？ 自分のどこと関係ある？</p>
                <div className="hochi-chat-messages">
                  <div className="hochi-chat-msg clone">
                    今日のTopicは、あなたが空間の雰囲気に反応しやすいところと、記録する趣味の交差点から生まれました。
                  </div>
                </div>
                <input className="hochi-chat-input" placeholder="メッセージを入力…" />
              </>
            )}
            {overlay === 'notes' && (
              <>
                <h2>ナレッジベース</h2>
                <ul className="hochi-notes-list">
                  <li>エージェント設計の原理</li>
                  <li>読書キュー</li>
                  <li>毎日の振り返り</li>
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
