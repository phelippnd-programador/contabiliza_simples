import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppListNotFound from "../AppListNotFound";

export type PeriodCashPoint = {
  label: string;
  entradas: number;
  saidas: number;
};

type PeriodCashChartProps = {
  title: string;
  data: PeriodCashPoint[];
};

const formatCurrencyCompact = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const PeriodCashChart = ({ title, data }: PeriodCashChartProps) => {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const palette = {
    grid: isDark ? "#1f2937" : "#e5e7eb",
    axis: isDark ? "#94a3b8" : "#6b7280",
    tooltipBg: isDark ? "#0f172a" : "#ffffff",
    tooltipBorder: isDark ? "#334155" : "#e5e7eb",
    tooltipText: isDark ? "#e2e8f0" : "#111827",
  };

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
          {title}
        </h3>
        <div className="mt-3">
          <AppListNotFound texto="Sem dados no periodo selecionado." />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
          {title}
        </h3>
      </div>

      <div className="mt-4 h-[260px] w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: palette.axis }} />
            <YAxis
              tick={{ fontSize: 12, fill: palette.axis }}
              tickFormatter={(value) => formatCurrencyCompact(Number(value))}
            />
            <Tooltip
              formatter={(value: number) => formatCurrencyCompact(value)}
              labelStyle={{ fontSize: 12, color: palette.tooltipText }}
              contentStyle={{
                backgroundColor: palette.tooltipBg,
                borderColor: palette.tooltipBorder,
                color: palette.tooltipText,
                borderRadius: 8,
                fontSize: 12,
              }}
              itemStyle={{ color: palette.tooltipText, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ color: palette.axis }} />
            <Line
              type="monotone"
              dataKey="entradas"
              name="Entradas"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="saidas"
              name="Saidas"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PeriodCashChart;
