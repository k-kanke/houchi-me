import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import BottomTabBar from './components/BottomTabBar.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'
import PostScreen from './screens/PostScreen.jsx'
import LogScreen from './screens/LogScreen.jsx'

import { initialReservations, initialLogs } from './data/dummyData.js'
import { supabase } from './lib/supabase.js'

function toUiExperience(row) {
  return {
    id: row.id,
    title: row.title,
    genre: row.category,
    description: row.description,
    location: row.location,
    price: row.fee === 0 ? '初回無料' : `${row.fee}円`,
    isFirstTimeFree: row.fee === 0,
    pointReward: row.point_reward,
    capacity: row.capacity,
    reservedCount: row.reserved_count,
    creator: row.users?.name ?? 'ユーザー',
    creatorAvatar: '🌱',
    isBeginnerFriendly: false,
    isFriendOk: false,
    startTime: row.scheduled_at,
    thumbnailUrl: row.media_url,
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [authUser, setAuthUser] = useState(null)
  const [user, setUser] = useState({ name: '', points: 0, title: '' })
  const [experiences, setExperiences] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthUser(session.user)
      } else {
        supabase.auth.signInAnonymously().then(({ data }) => {
          setAuthUser(data.user)
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authUser) return

    const loadOrCreateUser = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (data) {
        setUser(data)
      } else {
        const { data: created } = await supabase
          .from('users')
          .insert({ id: authUser.id })
          .select()
          .single()
        if (created) setUser(created)
      }
    }

    loadOrCreateUser()
  }, [authUser])

  const fetchExperiences = async () => {
    const { data } = await supabase
      .from('experiences')
      .select('*, users(name)')
      .order('created_at', { ascending: false })
    if (data) setExperiences(data.map(toUiExperience))
  }

  useEffect(() => {
    fetchExperiences()
  }, [])

  const [reservations, setReservations] = useState(initialReservations)
  const [logs, setLogs] = useState(initialLogs)
  const [logTarget, setLogTarget] = useState(null)

  const reservedIds = useMemo(
    () => new Set(reservations.map((r) => r.experienceId)),
    [reservations],
  )

  const handleReserve = (experience) => {
    if (reservedIds.has(experience.id)) return
    setReservations((prev) => [
      {
        id: `r-${Date.now()}`,
        experienceId: experience.id,
        title: experience.title,
        startTime: experience.startTime,
        location: experience.location,
        completed: false,
      },
      ...prev,
    ])
  }

  const handleWriteLog = (reservation) => {
    setLogTarget(reservation)
  }

  const handleSaveLog = (log) => {
    setLogs((prev) => [log, ...prev])
    setReservations((prev) =>
      prev.map((r) =>
        r.id === log.reservationId ? { ...r, completed: true } : r,
      ),
    )
    setUser((prev) => ({
      ...prev,
      points: prev.points + (log.pointEarned || 30),
      joinedCount: prev.joinedCount + 1,
    }))
  }

  const handleLogFinish = () => {
    setLogTarget(null)
    setActiveTab('profile')
  }

  const handleLogCancel = () => {
    setLogTarget(null)
  }

  const handlePostSubmit = async (formData) => {
    if (!authUser) return
    await supabase.from('experiences').insert({
      creator_id: authUser.id,
      title: formData.title,
      description: formData.description,
      category: formData.genre,
      location: formData.location,
      fee: formData.isFirstTimeFree ? 0 : parseInt(formData.priceAmount || 0),
      capacity: formData.capacity,
      scheduled_at: formData.date && formData.time
        ? new Date(`${formData.date}T${formData.time}`).toISOString()
        : null,
    })
    await fetchExperiences()
  }

  const handlePostBackHome = () => {
    setActiveTab('home')
  }

  // どのタブを描画するか
  const tabScreen = (() => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            key="home"
            experiences={experiences}
            reservedIds={reservedIds}
            onReserve={handleReserve}
          />
        )
      case 'post':
        return (
          <PostScreen
            key="post"
            onSubmit={handlePostSubmit}
            onBackToHome={handlePostBackHome}
          />
        )
      case 'profile':
        return (
          <ProfileScreen
            key="profile"
            user={user}
            reservations={reservations}
            logs={logs}
            onWriteLog={handleWriteLog}
          />
        )
      default:
        return null
    }
  })()

  return (
    <div className="device-frame relative">
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
          >
            {tabScreen}
          </motion.div>
        </AnimatePresence>

        {/* BottomTabBar はホーム/プロフィール/投稿のフォーム上でも表示。LogScreenを開いている間は隠す */}
        {!logTarget && (
          <BottomTabBar active={activeTab} onChange={setActiveTab} />
        )}

        {/* S5: 参加後ログ画面（オーバーレイ） */}
        <AnimatePresence>
          {logTarget && (
            <motion.div
              key="log-overlay"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="absolute inset-0 z-50 bg-bg-primary"
            >
              <LogScreen
                reservation={logTarget}
                onSave={handleSaveLog}
                onCancel={handleLogCancel}
                onFinish={handleLogFinish}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
