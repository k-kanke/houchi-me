import { useState } from 'react'
// hochi-me
import { loadClone } from './data/hochiDummy.js'
import OnboardingModal from './screens/OnboardingModal.jsx'
import WorldScreen from './screens/WorldScreen.jsx'

export default function App() {
  const [clone, setClone] = useState(() => loadClone())

  if (!clone) {
    return <OnboardingModal onComplete={setClone} />
  }

  return <WorldScreen clone={clone} />
}
