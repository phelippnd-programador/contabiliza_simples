import React from "react";
import Card from "./Card";

type DashboardStatCardProps = {
  title: string;
  value: string;
  helper?: string;
  tone?: "blue" | "green" | "amber" | "purple";
  icon?: React.ReactNode;
};

const iconToneClasses: Record<
  NonNullable<DashboardStatCardProps["tone"]>,
  string
> = {
  blue: "text-sky-700 bg-sky-100/80 dark:text-sky-200 dark:bg-sky-500/10",
  green: "text-emerald-700 bg-emerald-100/80 dark:text-emerald-200 dark:bg-emerald-500/10",
  amber: "text-amber-700 bg-amber-100/80 dark:text-amber-200 dark:bg-amber-500/10",
  purple: "text-indigo-700 bg-indigo-100/80 dark:text-indigo-200 dark:bg-indigo-500/10",
};

const DashboardStatCard = ({
  title,
  value,
  helper,
  tone = "blue",
  icon,
}: DashboardStatCardProps) => {
  return (
    <Card tone={tone} className="p-2 gap-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {value}
          </p>
        </div>
        {icon ? (
          <span
            className={[
              "inline-flex h-11 w-11 items-center justify-center rounded-2xl text-lg shadow-sm",
              iconToneClasses[tone],
            ].join(" ")}
          >
            {icon}
          </span>
        ) : null}
      </div>
      {helper ? (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{helper}</p>
      ) : null}
    </Card>
  );
};

export default DashboardStatCard;
