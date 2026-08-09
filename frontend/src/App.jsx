import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import AppRoutes from './routes/AppRoutes'
import SplashScreen from './components/SplashScreen/SplashScreen'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {/* Background application routes */}
      <AppRoutes />

      {/* 3D Anti-Gravity Splash Screen Overlay */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

export default App
