import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import BottomTabBar from './components/BottomTabBar.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'
import PostScreen from './screens/PostScreen.jsx'
import LogScreen from './screens/LogScreen.jsx'

import {
  experiences as baseExperiences,
  initialUser,
  initialReservations,
  initialLogs,
} from './data/dummyData.js'
import { supabase } from './lib/supabase.js'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [authUser, setAuthUser] = useState(null)
  const [user, setUser] = useState(initialUser)

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

  const [reservations, setReservations] = useState(initialReservations)
  const [logs, setLogs] = useState(initialLogs)
  const [userPosts, setUserPosts] = useState([])
  const [logTarget, setLogTarget] = useState(null) // reservation for S5

  const experiences = useMemo(
    () => [...userPosts, ...baseExperiences],
    [userPosts],
  )

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

  const handlePostSubmit = (post) => {
    setUserPosts((prev) => [post, ...prev])
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
