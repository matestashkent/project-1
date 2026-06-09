'use client';
import { useEffect, useState } from 'react';

interface Stats {
  totalUsers: number;
  activeToday: number;
  activeWeek: number;
  activeMonth: number;
  totalEssays: number;
  proUsers: number;
}

interface AdminUser {
  id: string;
  telegramId: string;
  name: string;
  level: string;
  targetBand: number;
  streak: number;
  lessonsCompleted: number;
  writingSubmissions: number;
  lastActive: string;
  createdAt: string;
  subscription: { plan: string; expiresAt: string } | null;
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' });
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const login = async () => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      loadData();
    } else {
      setLoginError('Неверный пароль');
    }
  };

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setAuthed(false);
  };

  const loadData = async () => {
    setLoading(true);
    const [sRes, uRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/users'),
    ]);
    if (sRes.status === 401 || uRes.status === 401) { setLoading(false); return; }
    const s = await sRes.json();
    const u = await uRes.json();
    setStats(s);
    setUsers(u.users);
    setAuthed(true);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const grantPro = async (userId: string, days: number) => {
    setActionLoading(userId + 'grant');
    await fetch(`/api/admin/users/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'grant', days }),
    });
    await loadData();
    setActionLoading(null);
  };

  const revokePro = async (userId: string) => {
    setActionLoading(userId + 'revoke');
    await fetch(`/api/admin/users/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoke' }),
    });
    await loadData();
    setActionLoading(null);
  };

  const deleteUser = async (userId: string, name: string) => {
    if (!confirm(`Удалить пользователя "${name}"? Это нельзя отменить.`)) return;
    setActionLoading(userId + 'delete');
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    setUsers(u => u.filter(x => x.id !== userId));
    setActionLoading(null);
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.telegramId.includes(search)
  );

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-white text-2xl font-bold mb-2">Mentora Admin</h1>
          <p className="text-gray-500 text-sm mb-6">Введи пароль для доступа</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Пароль"
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 mb-3 outline-none focus:border-amber-500 transition-colors"
          />
          {loginError && <p className="text-red-400 text-sm mb-3">{loginError}</p>}
          <button
            onClick={login}
            className="w-full bg-amber-500 text-gray-950 font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Mentora Admin</h1>
            <p className="text-gray-500 text-sm mt-0.5">Управление пользователями</p>
          </div>
          <button onClick={logout} className="text-gray-500 text-sm hover:text-white transition-colors">
            Выйти
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats grid */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                {[
                  { label: 'Всего пользователей', value: stats.totalUsers, color: 'text-white' },
                  { label: 'Активны сегодня', value: stats.activeToday, color: 'text-emerald-400' },
                  { label: 'Активны за неделю', value: stats.activeWeek, color: 'text-sky-400' },
                  { label: 'Активны за месяц', value: stats.activeMonth, color: 'text-violet-400' },
                  { label: 'Эссе написано', value: stats.totalEssays, color: 'text-amber-400' },
                  { label: 'Pro подписок', value: stats.proUsers, color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-gray-500 text-xs mt-1 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Search + refresh */}
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по имени или Telegram ID..."
                className="flex-1 bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500 transition-colors"
              />
              <button
                onClick={loadData}
                className="bg-gray-900 border border-gray-800 text-gray-400 px-4 py-2.5 rounded-xl text-sm hover:text-white transition-colors"
              >
                Обновить
              </button>
            </div>

            {/* Users table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Пользователь</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Telegram ID</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Уровень</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Streak</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Уроков</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Эссе</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Активность</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Подписка</th>
                      <th className="text-left text-gray-500 font-medium px-4 py-3">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{u.name}</p>
                          <p className="text-gray-600 text-xs">Цель: {u.targetBand}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{u.telegramId}</td>
                        <td className="px-4 py-3 text-gray-300">{u.level}</td>
                        <td className="px-4 py-3 text-amber-400 font-bold">{u.streak}</td>
                        <td className="px-4 py-3 text-gray-300">{u.lessonsCompleted}</td>
                        <td className="px-4 py-3 text-gray-300">{u.writingSubmissions}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{fmt(u.lastActive)}</td>
                        <td className="px-4 py-3">
                          {u.subscription ? (
                            <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-lg text-xs font-medium">
                              Pro до {fmt(u.subscription.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">Free</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {u.subscription ? (
                              <button
                                onClick={() => revokePro(u.id)}
                                disabled={actionLoading === u.id + 'revoke'}
                                className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2.5 py-1.5 rounded-lg hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-40"
                              >
                                {actionLoading === u.id + 'revoke' ? '...' : 'Снять Pro'}
                              </button>
                            ) : (
                              <button
                                onClick={() => grantPro(u.id, 30)}
                                disabled={actionLoading === u.id + 'grant'}
                                className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-40"
                              >
                                {actionLoading === u.id + 'grant' ? '...' : 'Дать Pro 30д'}
                              </button>
                            )}
                            <button
                              onClick={() => deleteUser(u.id, u.name)}
                              disabled={actionLoading === u.id + 'delete'}
                              className="text-xs bg-gray-800 border border-gray-700 text-gray-500 px-2.5 py-1.5 rounded-lg hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-40"
                            >
                              {actionLoading === u.id + 'delete' ? '...' : 'Удалить'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-gray-600">
                          {search ? 'Пользователи не найдены' : 'Пользователей пока нет'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-gray-700 text-xs mt-4 text-center">
              {filtered.length} из {users.length} пользователей
            </p>
          </>
        )}
      </div>
    </div>
  );
}
