import React, { forwardRef } from "react";
import { AppLabel } from "../text/AppTitle";
import AppTooltip from "../AppTooltip";

interface AppHoraInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  title?: string;
  error?: string;
  helperText?: string;
  tooltip?: string;
  tooltipPosition?: "top" | "right" | "bottom" | "left";
}

const AppHoraInput = forwardRef<HTMLInputElement, AppHoraInputProps>(
  (
    {
      title,
      required,
      error,
      className,
      tooltip,
      tooltipPosition = "top",
      helperText,
      ...props
    },
    ref
  ) => (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-center gap-2">
        {title && <AppLabel text={title} />}
        {required && <span className="text-red-500">*</span>}
        {tooltip && <AppTooltip text={tooltip} tooltipPosition={tooltipPosition} />}
      </div>

      <input
        ref={ref}
        {...props}
        type="time"
        step={props.step ?? 60}
        placeholder={props.placeholder ?? "HH:MM"}
        className={[
          props.disabled ? "bg-slate-100/80 cursor-not-allowed" : "bg-white/80",
          "h-11 w-full rounded-xl px-3 text-sm border",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
            : "border-slate-200/70 hover:border-slate-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-200",
          "text-slate-900 shadow-sm dark:bg-slate-900/80 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-sky-900/40",
          "outline-none transition",
          "appearance-none",
          className ?? "",
        ].join(" ")}
      />

      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : (
        helperText && <span className="text-xs text-slate-500 dark:text-slate-400">{helperText}</span>
      )}
    </div>
  )
);

AppHoraInput.displayName = "AppHoraInput";

export default AppHoraInput;
