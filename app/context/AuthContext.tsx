"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { useRouter, usePathname } from "next/navigation"

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

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(name + "="))
  return match ? match.split("=")[1] : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [devUnlocked, setDevUnlocked] = useState(false)

  // ----------------------------------
  // INITIAL SESSION RESOLUTION (ONCE)
  // ----------------------------------
  useEffect(() => {
    const devKey = getCookie("sx_dev_key")

    if (
      devKey &&
      devKey === process.env.NEXT_PUBLIC_DEV_MASTER_KEY
    ) {
      setDevUnlocked(true)
      setLoading(false)
      return
    }

    // no backend auth yet
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

  // ----------------------------------
  // ROUTE GUARD (STABLE)
  // ----------------------------------
  useEffect(() => {
    if (loading) return

    // 🔑 DEV MASTER KEY = FULL ACCESS
    if (devUnlocked) return

    // HARD BYPASS — FOUNDER OPS
    if (pathname.startsWith("/founder")) return

    // PUBLIC ROUTES
    const isPublic =
      pathname === "/" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/marketplace")

    if (!user && !isPublic) {
      router.replace("/login")
    }
  }, [loading, devUnlocked, user, pathname, router])

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
