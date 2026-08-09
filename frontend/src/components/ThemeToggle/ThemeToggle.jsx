import { motion } from 'framer-motion'
import { FaSun, FaMoon } from 'react-icons/fa'
import useTheme from '../../hooks/useTheme'
import './ThemeToggle.css'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="theme-toggle__icon-wrap"
        initial={false}
        animate={{ rotate: isDark ? 360 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {isDark ? (
          <FaSun className="theme-toggle__icon theme-toggle__icon--sun" />
        ) : (
          <FaMoon className="theme-toggle__icon theme-toggle__icon--moon" />
        )}
      </motion.div>
    </motion.button>
  )
}

export default ThemeToggle
