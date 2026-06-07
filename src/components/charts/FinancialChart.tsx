"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartData {
  month: string;
  vorderingen: number;
  schulden: number;
}

function formatEuroShort(value: number): string {
  if (Math.abs(value) >= 1000) return `€${(value / 1000).toFixed(0)}k`;
  return `€${value}`;
}

export default function FinancialChart({ userId }: { userId: string }) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/supabase/financial-data")
      .then((r) => r.json())
      .then((result) => {
        const mockMonthlyData: ChartData[] = [
          "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun",
          "Jul", "Aug", "Sep", "Okt", "Nov", "Dec",
        ].map((month, i) => ({
          month,
          vorderingen: Math.round((result.summary?.totalReceivables ?? 0) * (0.7 + Math.random() * 0.6) / 12),
          schulden: Math.round((result.summary?.totalPayables ?? 0) * (0.7 + Math.random() * 0.6) / 12),
        }));
        setData(mockMonthlyData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-6">Cashflow overzicht</h2>
      {loading ? (
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVorderingen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSchulden" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatEuroShort} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: number) => formatEuroShort(v)} />
            <Legend />
            <Area
              type="monotone"
              dataKey="vorderingen"
              stroke="#3b82f6"
              fill="url(#colorVorderingen)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="schulden"
              stroke="#ef4444"
              fill="url(#colorSchulden)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
