'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useLoyaltyPoints } from '@/components/LoyaltyPoints';
import AccountSidebar from '@/components/AccountSidebar';
import { supabase } from '@/lib/supabase';

/* ─── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, href, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  color: string;
}) {
  const inner = (
    <div className={`relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-200 ${href ? 'cursor-pointer group' : ''}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900 dark:text-white leading-none mb-0.5">{value}</p>
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">{sub}</p>}
      </div>
      {href && (
        <span className="absolute top-4 right-4 w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

/* ─── Quick-link card ──────────────────────────────────────────────────────── */
function QuickLink({ icon, label, desc, href }: { icon: React.ReactNode; label: string; desc: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 group">
      <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 group-hover:bg-black dark:group-hover:bg-white transition-colors">
        <span className="text-neutral-600 dark:text-neutral-400 group-hover:text-white dark:group-hover:text-black transition-colors">
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{label}</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{desc}</p>
      </div>
      <svg className="w-4 h-4 text-neutral-300 dark:text-neutral-600 ml-auto flex-shrink-0 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/* ─── Order status badge ───────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  pending:    { label: 'Pendiente',   dot: 'bg-amber-400',  text: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' },
  processing: { label: 'Procesando', dot: 'bg-blue-400',   text: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
  shipped:    { label: 'Enviado',    dot: 'bg-purple-400', text: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' },
  delivered:  { label: 'Entregado',  dot: 'bg-green-400',  text: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30' },
  cancelled:  { label: 'Cancelado',  dot: 'bg-red-400',    text: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30' },
};

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function CuentaPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { favorites } = useFavorites();
  const router = useRouter();
  const loyalty = useLoyaltyPoints();

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addressCount, setAddressCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user?.id) {
      loadDashboardData();
    }
  }, [authLoading, isAuthenticated, user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    try {
      const [ordersRes, profileRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, created_at, total, status, items')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('profiles')
          .select('addresses')
          .eq('id', user.id)
          .single(),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (profileRes.data?.addresses) {
        setAddressCount(Array.isArray(profileRes.data.addresses) ? profileRes.data.addresses.length : 0);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-black">
        <MainNav />
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-200 border-t-black dark:border-neutral-700 dark:border-t-white animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Build initials avatar
  const fullName = [user?.name, user?.lastName].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'U';
  const initials = fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  // Loyalty level color
  const levelColors: Record<string, string> = {
    Bronce: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    Plata:  'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300',
    Oro:    'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    Diamante: 'text-cyan-700 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400',
  };
  const levelColor = levelColors[loyalty?.level || 'Bronce'] || levelColors.Bronce;

  const totalOrders = orders.length;
  const loyaltyPoints = loyalty?.totalPoints ?? 0;
  const loyaltyEuros = (loyaltyPoints / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Welcome banner ── */}
        <div className="relative bg-black dark:bg-white rounded-3xl overflow-hidden mb-8 px-8 py-8 flex items-center gap-6">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          {/* Avatar */}
          <div className="relative flex-shrink-0 w-16 h-16 rounded-2xl bg-white/20 dark:bg-black/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-white dark:text-black">{initials}</span>
          </div>

          {/* Name + level */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 dark:text-black/60 mb-1">Bienvenido de vuelta</p>
            <h1 className="text-2xl font-bold text-white dark:text-black truncate">{fullName}</h1>
            <p className="text-sm text-white/70 dark:text-black/70">{user?.email}</p>
          </div>

          {/* Level badge */}
          {loyalty && (
            <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${levelColor}`}>
                {loyalty.level}
              </span>
              <p className="text-[11px] text-white/50 dark:text-black/50">{loyaltyPoints} puntos</p>
            </div>
          )}

          {/* Edit profile link */}
          <Link
            href="/cuenta/perfil"
            className="hidden md:flex flex-shrink-0 items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 text-white dark:text-black text-xs font-semibold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar perfil
          </Link>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <AccountSidebar />

          <div className="lg:col-span-3 space-y-8">

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>}
                label="Pedidos"
                value={ordersLoading ? '—' : totalOrders}
                sub="en total"
                href="/cuenta/pedidos"
                color="bg-blue-50 dark:bg-blue-900/30"
              />
              <StatCard
                icon={<svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                label="Puntos"
                value={loyaltyPoints}
                sub={`≈ ${loyaltyEuros}€ de descuento`}
                color="bg-yellow-50 dark:bg-yellow-900/30"
              />
              <StatCard
                icon={<svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                label="Favoritos"
                value={favorites.length}
                sub="productos guardados"
                href="/cuenta/favoritos"
                color="bg-rose-50 dark:bg-rose-900/30"
              />
              <StatCard
                icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                label="Direcciones"
                value={addressCount}
                sub="guardadas"
                href="/cuenta/direcciones"
                color="bg-emerald-50 dark:bg-emerald-900/30"
              />
            </div>

            {/* Loyalty progress bar */}
            {loyalty && loyalty.pointsToNext > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Nivel {loyalty.level}</p>
                      <p className="text-[11px] text-neutral-400">{loyalty.pointsToNext} puntos para {loyalty.nextLevel}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${levelColor}`}>{loyalty.level}</span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  {(() => {
                    const levels = [
                      { min: 0, max: 500 }, { min: 500, max: 2000 },
                      { min: 2000, max: 5000 }, { min: 5000, max: 5000 },
                    ];
                    const levelIdx = ['Bronce','Plata','Oro','Diamante'].indexOf(loyalty.level);
                    const level = levels[Math.max(0, levelIdx)];
                    const pct = levelIdx === 3 ? 100 :
                      Math.min(100, ((loyaltyPoints - level.min) / (level.max - level.min)) * 100);
                    return (
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Recent orders */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Pedidos recientes</h2>
                <Link href="/cuenta/pedidos" className="text-xs font-semibold text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
                  Ver todos →
                </Link>
              </div>

              {ordersLoading ? (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {[1,2,3].map(i => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3" />
                        <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded w-1/4" />
                      </div>
                      <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Sin pedidos todavía</p>
                  <p className="text-xs text-neutral-400 mb-4">Explora nuestra tienda y haz tu primer pedido.</p>
                  <Link href="/productos" className="inline-flex items-center gap-1.5 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
                    Ir a la tienda
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {orders.map((order) => {
                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    const date = new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                    const itemCount = Array.isArray(order.items) ? order.items.length : '—';
                    return (
                      <Link key={order.id} href="/cuenta/pedidos" className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            Pedido <span className="font-mono text-xs text-neutral-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">{date} · {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}</p>
                        </div>
                        {/* Status + total */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          <span className="text-sm font-bold text-neutral-900 dark:text-white">€{Number(order.total).toFixed(2)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick links grid */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">Accesos directos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickLink
                  href="/cuenta/pedidos"
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>}
                  label="Mis pedidos"
                  desc="Consulta el estado de tus compras"
                />
                <QuickLink
                  href="/cuenta/favoritos"
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                  label="Lista de deseos"
                  desc={`${favorites.length} producto${favorites.length !== 1 ? 's' : ''} guardado${favorites.length !== 1 ? 's' : ''}`}
                />
                <QuickLink
                  href="/cuenta/direcciones"
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                  label="Mis direcciones"
                  desc="Gestiona tus direcciones de envío"
                />
                <QuickLink
                  href="/cuenta/devoluciones"
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>}
                  label="Devoluciones"
                  desc="Inicia o consulta devoluciones"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
