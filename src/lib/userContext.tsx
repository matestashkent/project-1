'use client';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export interface DbUser {
  id: string;
  telegramId: string;
  name: string;
  language: string;
  level: string;
  targetBand: number;
  examIn: string;
  studyMinutes: number;
  weakAreas: string[];
  streak: number;
  lessonsCompleted: number;
  writingSubmissions: number;
  mockExamsCompleted: number;
  currentBand: number;
  writingBands: Array<{ band: number; date: string }>;
  subscription: { plan: string; status: string; expiresAt: string } | null;
}

interface UserContextType {
  user: DbUser | null;
  telegramId: string | null;
  token: string | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  telegramId: null,
  token: null,
  loading: true,
  refreshUser: async () => {},
});

const TOKEN_KEY = 'mentora_token';
const TG_ID_KEY = 'mentora_tgid';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DbUser | null>(null);
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (tok: string): Promise<DbUser | null> => {
    try {
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const { user: dbUser } = await res.json();
        setUser(dbUser);
        return dbUser;
      }
    } catch {}
    return null;
  }, []);

  const refreshUser = useCallback(async () => {
    const tok = token || localStorage.getItem(TOKEN_KEY);
    if (tok) await fetchProfile(tok);
  }, [token, fetchProfile]);

  useEffect(() => {
    async function authenticate() {
      try {
        const tg = (window as any).Telegram?.WebApp;
        const initData = tg?.initData || '';

        const authRes = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });

        if (authRes.ok) {
          const { user: authUser, token: newToken } = await authRes.json();
          localStorage.setItem(TOKEN_KEY, newToken);
          localStorage.setItem(TG_ID_KEY, authUser.telegramId);
          setToken(newToken);
          setTelegramId(authUser.telegramId);
          await fetchProfile(newToken);
        } else {
          // Fallback: use cached token
          const cached = localStorage.getItem(TOKEN_KEY);
          const cachedId = localStorage.getItem(TG_ID_KEY);
          if (cached && cachedId) {
            setToken(cached);
            setTelegramId(cachedId);
            await fetchProfile(cached);
          }
        }
      } catch {
        const cached = localStorage.getItem(TOKEN_KEY);
        const cachedId = localStorage.getItem(TG_ID_KEY);
        if (cached && cachedId) {
          setToken(cached);
          setTelegramId(cachedId);
          await fetchProfile(cached);
        }
      } finally {
        setLoading(false);
      }
    }

    authenticate();
  }, [fetchProfile]);

  return (
    <UserContext.Provider value={{ user, telegramId, token, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
