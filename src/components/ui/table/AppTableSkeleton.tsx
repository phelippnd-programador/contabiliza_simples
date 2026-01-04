import React from "react";

type AppTableSkeletonProps = {
  columns: number;
  rows?: number;
};

const AppTableSkeleton = ({ columns, rows = 6 }: AppTableSkeletonProps) => {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-800">
      <div className="bg-gray-50 px-4 py-3 text-xs uppercase text-gray-500 dark:bg-slate-900 dark:text-gray-400">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={`head-${index}`} className="h-3 w-24 rounded bg-gray-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-4 px-4 py-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-3 w-full rounded bg-gray-200 dark:bg-slate-800"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppTableSkeleton;
