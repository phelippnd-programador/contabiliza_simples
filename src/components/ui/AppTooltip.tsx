import React from "react";

const tooltipPositionClass = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

interface AppTooltipProps {
  tooltipPosition?: "top" | "right" | "bottom" | "left";
  text: string;
}

const AppTooltip = ({ text, tooltipPosition = "top" }: AppTooltipProps) => {
  return (
    <div className="relative group">
      <span className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-[10px] font-semibold text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600">
        i
      </span>

      <div
        className={[
          "absolute z-50 hidden group-hover:block",
          "rounded-lg border border-slate-200/70 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-xl",
          "whitespace-nowrap backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100",
          tooltipPositionClass[tooltipPosition],
        ].join(" ")}
      >
        {text}
      </div>
    </div>
  );
};

export default AppTooltip;
