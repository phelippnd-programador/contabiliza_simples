import React from "react";

type AppSummaryCardProps = {
  title: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  details?: React.ReactNode[];
};

const AppSummaryCard = ({ title, value, helper, details }: AppSummaryCardProps) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{title}</p>
    <p className="mt-1 text-2xl font-semibold">{value}</p>
    {helper ? <p className="text-xs text-slate-400">{helper}</p> : null}
    {details?.length
      ? details.map((detail, index) => (
          <p key={index} className="text-xs text-slate-400">
            {detail}
          </p>
        ))
      : null}
  </div>
);

export default AppSummaryCard;
