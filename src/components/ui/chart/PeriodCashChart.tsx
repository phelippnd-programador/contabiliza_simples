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
  if (!data.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="mt-3">
          <AppListNotFound texto="Sem dados no periodo selecionado." />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="mt-4 h-[260px] w-full">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrencyCompact(Number(value))}
            />
            <Tooltip
              formatter={(value: number) => formatCurrencyCompact(value)}
              labelStyle={{ fontSize: 12 }}
            />
            <Legend />
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
