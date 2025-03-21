'use client'

import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

export type AuthUser = {
  user: {
    id: string,
    email: string
  }
}

export const UserContext = createContext<{
  user: AuthUser | null | undefined
  setUser: Dispatch<SetStateAction<AuthUser | null | undefined>>
  fetchUser: () => void
}>({
  user: undefined,
  setUser: () => {},
  fetchUser: () => {},
})

type UserProviderProps = {
  children: ReactNode
}

export function UserProvider({
  children,
  ...props
}: UserProviderProps) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)

  const fetchUser = useCallback(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    }).then(res => {
      if (res.ok) {
        res.json().then(setUser)
      } else {
        setUser(null)
      }
    }).catch(() => setUser(null))
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <UserContext.Provider {...props} value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
