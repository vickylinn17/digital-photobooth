import { useState } from 'react'
import LandingPage from './components/LandingPage'
import BoothScreen from './components/BoothScreen'
import CoinCursor from './components/CoinCursor'

export default function App() {
  const [screen, setScreen] = useState('landing')

  return (
    <>
      {screen === 'landing' && <CoinCursor />}
      {screen === 'landing'
        ? <LandingPage onEnter={() => setScreen('booth')} />
        : <BoothScreen onExit={() => setScreen('landing')} />
      }
    </>
  )
}
