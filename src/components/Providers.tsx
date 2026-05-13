'use client';
import { UserProvider } from '@/lib/userContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
