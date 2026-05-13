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
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  telegramId: null,
  loading: true,
  refreshUser: async () => {},
});

const TG_ID_KEY = 'mentora_tgid';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DbUser | null>(null);
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (tgId: string): Promise<DbUser | null> => {
    try {
      const res = await fetch('/api/user/profile', {
        headers: { 'x-telegram-id': tgId },
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
    const tgId = telegramId || localStorage.getItem(TG_ID_KEY);
    if (tgId) await fetchProfile(tgId);
  }, [telegramId, fetchProfile]);

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
          const { user: authUser } = await authRes.json();
          const tgId = authUser.telegramId;
          localStorage.setItem(TG_ID_KEY, tgId);
          setTelegramId(tgId);
          await fetchProfile(tgId);
        } else {
          // Dev fallback: use cached telegramId
          const cached = localStorage.getItem(TG_ID_KEY);
          if (cached) {
            setTelegramId(cached);
            await fetchProfile(cached);
          }
        }
      } catch {
        const cached = localStorage.getItem(TG_ID_KEY);
        if (cached) {
          setTelegramId(cached);
          await fetchProfile(cached);
        }
      } finally {
        setLoading(false);
      }
    }

    authenticate();
  }, [fetchProfile]);

  return (
    <UserContext.Provider value={{ user, telegramId, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
