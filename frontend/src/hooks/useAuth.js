import { useContext } from 'react'
import { AuthContext } from '../context/authContext'

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    return { user: null, isAuthenticated: false }
  }
  return context
}

export default useAuth
