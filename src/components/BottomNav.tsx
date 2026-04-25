'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Главная' },
  { href: '/lesson', icon: '📚', label: 'Урок' },
  { href: '/writing', icon: '✍️', label: 'Writing' },
  { href: '/reading', icon: '📖', label: 'Reading' },
  { href: '/progress', icon: '📊', label: 'Прогресс' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-card border-t border-surface-border z-40 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-colors min-w-0 flex-1 ${
                active ? 'text-gold' : 'text-gray-600'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className={`text-[10px] font-medium truncate ${active ? 'text-gold' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
