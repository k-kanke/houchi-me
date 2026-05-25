import { useState } from 'react'
import { DEFAULT_CLONE, PERSONALITY_SHIFTS, saveClone } from '../data/hochiDummy.js'

export default function OnboardingModal({ onComplete }) {
  const [form, setForm] = useState({
    name: 'Mira',
    mbti: 'ENFP',
    likes: 'カフェ、韓ドラ、旅行、ファッション',
    bio: '人と話すのは好きだけど、1人で没頭できる趣味も欲しい',
    idealSelf: 'もっと自分の世界を持っている人になりたい',
    personalityShift: '少し外向的',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...DEFAULT_CLONE,
      name: form.name.trim() || 'Mira',
      displayName: `${form.name.trim() || 'Mira'}（ミラ）`,
      mbti: form.mbti,
      likes: form.likes,
      bio: form.bio,
      idealSelf: form.idealSelf,
      personalityShift: form.personalityShift,
      archetype: '感性探索型',
    }
    saveClone(data)
    onComplete(data)
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="hochi-onboard">
      <form className="hochi-onboard-panel" onSubmit={handleSubmit}>
        <div className="hochi-onboard-logo" />
        <h1>放置me</h1>
        <p className="hochi-onboard-tagline">あなたのクローンが、知らない自分を見つけてくる。</p>

        <label>
          クローンの名前
          <input value={form.name} onChange={set('name')} required />
        </label>
        <label>
          MBTI
          <input value={form.mbti} onChange={set('mbti')} />
        </label>
        <label>
          好きなもの
          <input value={form.likes} onChange={set('likes')} />
        </label>
        <label>
          自分の説明
          <textarea value={form.bio} onChange={set('bio')} rows={2} />
        </label>
        <label>
          なりたい自分
          <input value={form.idealSelf} onChange={set('idealSelf')} />
        </label>
        <label>
          本当の自分とは違う性格
          <select value={form.personalityShift} onChange={set('personalityShift')}>
            {PERSONALITY_SHIFTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="hochi-onboard-submit">
          叡智の図書館へ
        </button>
      </form>
    </div>
  )
}
