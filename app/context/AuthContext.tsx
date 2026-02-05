"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { useRouter } from "next/navigation"

type User = {
  email: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // ----------------------------------
  // INITIAL SESSION RESOLUTION (ONCE)
  // ----------------------------------
  useEffect(() => {
    // No backend auth yet - just mark as loaded
    setUser(null)
    setLoading(false)
  }, [])

  // ----------------------------------
  // LOGIN / LOGOUT FUNCTIONS
  // ----------------------------------
  const login = async (email: string, password: string) => {
    // For now, simulate login - implement real auth later
    setUser({ email })
  }

  const logout = () => {
    setUser(null)
    router.push("/login")
  }

  // NOTE: Route guard removed - app uses auth-store for authentication,
  // not this AuthContext. Each protected page handles its own auth check.

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return ctx
}
