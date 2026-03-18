'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// 1€ = 1 point, 100 points = 1€ discount
const POINTS_PER_EURO = 1;
const POINTS_TO_EURO = 100;

interface LoyaltyData {
  totalPoints: number;
  level: string;
  nextLevel: string;
  pointsToNext: number;
  discount: number;
}

const LEVELS = [
  { name: 'Bronce', min: 0, color: '#CD7F32', icon: '🥉' },
  { name: 'Plata', min: 500, color: '#C0C0C0', icon: '🥈' },
  { name: 'Oro', min: 2000, color: '#FFD700', icon: '🥇' },
  { name: 'Diamante', min: 5000, color: '#B9F2FF', icon: '💎' },
];

export function useLoyaltyPoints() {
  const { user } = useAuth();
  const [data, setData] = useState<LoyaltyData | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('total')
          .eq('user_id', user.id)
          .in('status', ['processing', 'shipped', 'delivered']);

        const totalSpent = (orders || []).reduce((s, o) => s + (o.total || 0), 0);
        const totalPoints = Math.floor(totalSpent * POINTS_PER_EURO);
        
        const currentLevel = [...LEVELS].reverse().find(l => totalPoints >= l.min) || LEVELS[0];
        const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];

        setData({
          totalPoints,
          level: currentLevel.name,
          nextLevel: nextLevel?.name || 'Máximo',
          pointsToNext: nextLevel ? nextLevel.min - totalPoints : 0,
          discount: Math.floor(totalPoints / POINTS_TO_EURO),
        });
      } catch {}
    };
    load();
  }, [user?.id]);

  return data;
}

export default function LoyaltyCard() {
  const data = useLoyaltyPoints();
  const { user } = useAuth();

  if (!user || !data) return null;

  const currentLevel = [...LEVELS].reverse().find(l => data.totalPoints >= l.min) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progress = nextLevel
    ? ((data.totalPoints - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400">Programa de Fidelidad</p>
          <p className="text-2xl font-bold">{data.totalPoints} puntos</p>
        </div>
        <div className="text-4xl">{currentLevel.icon}</div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Nivel {currentLevel.name}</span>
          <span>{nextLevel ? `${nextLevel.name} (${nextLevel.min} pts)` : 'Nivel máximo'}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: currentLevel.color }}
          />
        </div>
      </div>

      {data.discount > 0 && (
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <p className="text-sm">Tienes <span className="font-bold text-green-400">€{data.discount}</span> en descuentos disponibles</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {LEVELS.slice(0, 3).map(l => (
          <div key={l.name} className={`rounded-lg p-2 text-xs ${data.totalPoints >= l.min ? 'bg-white/10' : 'bg-white/5 opacity-50'}`}>
            <span className="text-lg">{l.icon}</span>
            <p className="mt-1">{l.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
