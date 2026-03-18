'use client';
import React from 'react';

// ─── BAR CHART ────────────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
  color = '#3B82F6',
  formatValue = (v) => `€${v.toFixed(0)}`,
}) => {
  if (data.length === 0) return <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>;

  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.min(40, (100 / data.length) * 0.6);
  const gap = (100 - barWidth * data.length) / (data.length + 1);

  return (
    <div>
      <svg viewBox={`0 0 100 ${height / 3}`} className="w-full" preserveAspectRatio="none">
        {data.map((d, i) => {
          const x = gap + i * (barWidth + gap);
          const barH = (d.value / max) * (height / 3 - 15);
          const y = height / 3 - barH - 2;
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={barWidth} height={barH}
                rx={2} fill={color} opacity={0.85}
                className="hover:opacity-100 transition-opacity cursor-pointer"
              >
                <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-gray-400 text-center" style={{ width: `${100 / data.length}%` }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── DONUT CHART ──────────────────────────────────────────────────
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 160 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>;

  const r = 35;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {data.map((d, i) => {
          const pct = d.value / total;
          const offset = circumference * (1 - pct);
          const rotation = (cumulative / total) * 360 - 90;
          cumulative += d.value;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={14}
              strokeDasharray={`${circumference * pct} ${circumference}`}
              transform={`rotate(${rotation} ${cx} ${cy})`}
              className="transition-all duration-500"
            >
              <title>{`${d.label}: ${d.value} (${(pct * 100).toFixed(0)}%)`}</title>
            </circle>
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-xl font-bold" fill="#1F2937" fontSize="14">
          {total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#9CA3AF" fontSize="6">
          total
        </text>
      </svg>

      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-gray-700">{d.label}</span>
            <span className="text-sm font-semibold text-gray-900 ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MINI SPARKLINE ───────────────────────────────────────────────
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color = '#3B82F6', height = 32 }) => {
  if (data.length < 2) return null;
  
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const padding = 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - padding * 2) + padding;
    const y = h - padding - ((v - min) / range) * (h - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${h - padding} ${points} ${w - padding},${h - padding}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// ─── STAT CARD WITH SPARKLINE ─────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number; // percentage
  sparkData?: number[];
  icon: React.ReactNode;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, change, sparkData, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}15` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      {change !== undefined && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </span>
      )}
    </div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {sparkData && sparkData.length > 1 && (
      <div className="mt-3">
        <Sparkline data={sparkData} color={color} />
      </div>
    )}
  </div>
);
