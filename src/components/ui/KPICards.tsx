"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";

interface KPI {
  label: string;
  value: string;
  trend?: "up" | "down";
  icon: React.ReactNode;
  color: string;
}

interface Summary {
  totalReceivables: number;
  totalPayables: number;
  netPosition: number;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function KPICards({ userId }: { userId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/supabase/financial-data")
      .then((r) => r.json())
      .then((data) => setSummary(data.summary))
      .finally(() => setLoading(false));
  }, []);

  const kpis: KPI[] = summary
    ? [
        {
          label: "Openstaande vorderingen",
          value: formatEuro(summary.totalReceivables),
          trend: "up",
          icon: <TrendingUp className="w-5 h-5" />,
          color: "text-blue-600 bg-blue-50",
        },
        {
          label: "Openstaande schulden",
          value: formatEuro(summary.totalPayables),
          trend: "down",
          icon: <TrendingDown className="w-5 h-5" />,
          color: "text-red-600 bg-red-50",
        },
        {
          label: "Nettopositie",
          value: formatEuro(summary.netPosition),
          icon: <DollarSign className="w-5 h-5" />,
          color: summary.netPosition >= 0
            ? "text-green-600 bg-green-50"
            : "text-red-600 bg-red-50",
        },
        {
          label: "Cashflow indicator",
          value: summary.netPosition >= 0 ? "Positief" : "Negatief",
          icon: <AlertCircle className="w-5 h-5" />,
          color: summary.netPosition >= 0
            ? "text-green-600 bg-green-50"
            : "text-orange-600 bg-orange-50",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-white rounded-xl p-6 shadow-sm">
          <div className={`inline-flex p-2 rounded-lg ${kpi.color} mb-3`}>
            {kpi.icon}
          </div>
          <p className="text-sm text-gray-500">{kpi.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}
