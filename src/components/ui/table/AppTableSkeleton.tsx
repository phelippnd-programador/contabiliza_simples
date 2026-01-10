import React from "react";

type AppTableSkeletonProps = {
  columns: number;
  rows?: number;
};

const AppTableSkeleton = ({ columns, rows = 6 }: AppTableSkeletonProps) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-4 text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:from-slate-900 dark:to-slate-950 dark:text-slate-400">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={`head-${index}`} className="h-3 w-24 rounded-full bg-slate-200/80 dark:bg-slate-800" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-4 px-5 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-3 w-full rounded-full bg-slate-200/80 dark:bg-slate-800"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppTableSkeleton;
